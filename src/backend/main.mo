import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import List "mo:core/List";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import { migration } "Migration";

// run system module migration on upgrade

(with migration)
actor {
  // Apply authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Utility module for auto-incrementing entity IDs
  module Entity {
    public func getNextId<T>(entities : Map.Map<Nat, T>) : Nat {
      var maxId = 0;
      for ((id, _entity) in entities.entries()) {
        if (id > maxId) { maxId := id };
      };
      maxId + 1;
    };
  };

  // Utility module for current timestamp (seconds since Unix epoch)
  module TimeUtils {
    public func currentTimestamp() : Int {
      Time.now() / 1_000_000_000;
    };
  };

  // Utility module for Float lists (sum, fromIter)
  module FloatList {
    public func sum(list : List.List<Float>) : Float {
      var result : Float = 0.0;
      for (value in list.values()) {
        result += value;
      };
      result;
    };

    public func fromIter(iter : Iter.Iter<Float>) : List.List<Float> {
      let list = List.empty<Float>();
      for (value in iter) {
        list.add(value);
      };
      list;
    };
  };

  public type Labour = {
    id : Nat;
    name : Text;
    phone : ?Text;
    notes : ?Text;
  };

  module Labour {
    public func compare(labour1 : Labour, labour2 : Labour) : Order.Order {
      switch (Text.compare(labour1.name, labour2.name)) {
        case (#equal) { Nat.compare(labour1.id, labour2.id) };
        case (order) { order };
      };
    };
  };

  public type Contract = {
    id : Nat;
    name : Text;
    multiplier : Float;
    contractAmount : Float;
    machineExp : Float;
    bedRate : ?Float;
    paperRate : ?Float;
    isSettled : Bool;
    createdAt : Int;
  };

  module Contract {
    public func compare(c1 : Contract, c2 : Contract) : Order.Order {
      Nat.compare(c1.id, c2.id);
    };
  };

  public type MeshColumn = {
    id : Nat;
    contractId : Nat;
    name : Text;
  };

  module MeshColumn {
    public func compare(c1 : MeshColumn, c2 : MeshColumn) : Order.Order {
      Nat.compare(c1.id, c2.id);
    };
  };

  public type ColumnType = {
    #Bed;
    #Paper;
    #Mesh : Nat;
  };

  module ColumnType {
    public func compareColumnType(c1 : ColumnType, c2 : ColumnType) : Order.Order {
      switch (c1, c2) {
        case (#Bed, #Bed) { #equal };
        case (#Paper, #Paper) { #equal };
        case (#Mesh(id1), #Mesh(id2)) { Nat.compare(id1, id2) };
        case (#Bed, _) { #less };
        case (#Paper, #Bed) { #greater };
        case (#Paper, #Mesh(_)) { #less };
        case (#Mesh(_), _) { #greater };
      };
    };
  };

  public type Attendance = {
    id : Nat;
    contractId : Nat;
    labourId : Nat;
    columnType : ColumnType;
    value : Float; // 0, 0.33, 0.66, 1.0
  };

  module Attendance {
    public func compare(att1 : Attendance, att2 : Attendance) : Order.Order {
      Nat.compare(att1.id, att2.id);
    };
  };

  public type Advance = {
    id : Nat;
    contractId : Nat;
    labourId : Nat;
    amount : Float;
    note : ?Text;
    createdAt : Int;
  };

  module Advance {
    public func compare(a1 : Advance, a2 : Advance) : Order.Order {
      Nat.compare(a1.id, a2.id);
    };
  };

  public type ContractDetails = {
    contract : Contract;
    meshColumns : [MeshColumn];
  };

  public type UserProfile = {
    name : Text;
  };

  // Data
  let labours = Map.empty<Nat, Labour>();
  let contracts = Map.empty<Nat, Contract>();
  let meshColumns = Map.empty<Nat, MeshColumn>();
  let attendance = Map.empty<Nat, Attendance>();
  let advances = Map.empty<Nat, Advance>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // === USER PROFILE FUNCTIONS ===

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // === LABOUR FUNCTIONS ===

  public shared ({ caller }) func createLabour(name : Text, phone : ?Text, notes : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create labours");
    };

    let id = Entity.getNextId(labours);
    let newLabour = {
      id;
      name;
      phone;
      notes;
    };
    labours.add(id, newLabour);
    id;
  };

  public shared ({ caller }) func updateLabour(id : Nat, name : Text, phone : ?Text, notes : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update labours");
    };

    switch (labours.get(id)) {
      case (null) { Runtime.trap("Labour not found") };
      case (?_) {
        let updated = {
          id;
          name;
          phone;
          notes;
        };
        labours.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteLabour(labourId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete labours");
    };
    if (not labours.containsKey(labourId)) {
      Runtime.trap("Labour not found");
    };
    labours.remove(labourId);
  };

  public query ({ caller }) func getAllLabours() : async [Labour] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view labours");
    };
    labours.values().toArray().sort();
  };

  // === CONTRACT FUNCTIONS ===

  public shared ({ caller }) func createContract(
    name : Text,
    multiplier : Float,
    contractAmount : Float,
    machineExp : Float,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create contracts");
    };
    let id = Entity.getNextId(contracts);
    let newContract = {
      id;
      name;
      multiplier;
      contractAmount;
      machineExp;
      bedRate = null;
      paperRate = null;
      isSettled = false;
      createdAt = TimeUtils.currentTimestamp();
    };
    contracts.add(id, newContract);
    id;
  };

  public shared ({ caller }) func updateContract(
    id : Nat,
    name : Text,
    multiplier : Float,
    contractAmount : Float,
    machineExp : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update contracts");
    };
    switch (contracts.get(id)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?original) {
        let updated = {
          id;
          name;
          multiplier;
          contractAmount;
          machineExp;
          bedRate = original.bedRate;
          paperRate = original.paperRate;
          isSettled = original.isSettled;
          createdAt = original.createdAt;
        };
        contracts.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func updateContractRates(
    id : Nat,
    bedRate : ?Float,
    paperRate : ?Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update contract rates");
    };
    switch (contracts.get(id)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?original) {
        let updated = {
          id = original.id;
          name = original.name;
          multiplier = original.multiplier;
          contractAmount = original.contractAmount;
          machineExp = original.machineExp;
          bedRate;
          paperRate;
          isSettled = original.isSettled;
          createdAt = original.createdAt;
        };
        contracts.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func markContractAsSettled(contractId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark contracts as settled");
    };
    switch (contracts.get(contractId)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?contract) {
        let updated = {
          id = contract.id;
          name = contract.name;
          multiplier = contract.multiplier;
          contractAmount = contract.contractAmount;
          machineExp = contract.machineExp;
          bedRate = contract.bedRate;
          paperRate = contract.paperRate;
          isSettled = true;
          createdAt = contract.createdAt;
        };
        contracts.add(contractId, updated);
      };
    };
  };

  public shared ({ caller }) func unsettleContract(contractId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unsettle contracts");
    };

    switch (contracts.get(contractId)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?contract) {
        let updated = {
          id = contract.id;
          name = contract.name;
          multiplier = contract.multiplier;
          contractAmount = contract.contractAmount;
          machineExp = contract.machineExp;
          bedRate = contract.bedRate;
          paperRate = contract.paperRate;
          isSettled = false;
          createdAt = contract.createdAt;
        };
        contracts.add(contractId, updated);
      };
    };
  };

  public query ({ caller }) func getAllContracts() : async [Contract] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view contracts");
    };
    contracts.values().toArray().sort();
  };

  public query ({ caller }) func getContractsBySettlement(isSettled : Bool) : async [Contract] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view contracts");
    };
    contracts.values().toArray().filter(
      func(c) { c.isSettled == isSettled }
    ).sort();
  };

  public query ({ caller }) func getContractById(contractId : Nat) : async ?Contract {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view contracts");
    };
    contracts.get(contractId);
  };

  // === MESH COLUMNS ===

  public shared ({ caller }) func createMeshColumn(contractId : Nat, name : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create mesh columns");
    };

    switch (contracts.get(contractId)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?_) {
        let id = Entity.getNextId(meshColumns);
        let column = {
          id;
          contractId;
          name;
        };
        meshColumns.add(id, column);
        id;
      };
    };
  };

  public query ({ caller }) func getMeshColumnsForContract(contractId : Nat) : async [MeshColumn] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view mesh columns");
    };
    meshColumns.values().toArray().filter(
      func(col) { col.contractId == contractId }
    ).sort();
  };

  public query ({ caller }) func getAllMeshColumns() : async [MeshColumn] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view mesh columns");
    };
    meshColumns.values().toArray().sort();
  };

  // === ATTENDANCE ===

  public shared ({ caller }) func setAttendanceEntry(
    contractId : Nat,
    labourId : Nat,
    columnType : ColumnType,
    value : Float,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set attendance");
    };
    switch (contracts.get(contractId), labours.get(labourId)) {
      case (null, _) { Runtime.trap("Invalid contract id") };
      case (_, null) { Runtime.trap("Invalid labour id") };
      case (?_, ?_) {
        let id = Entity.getNextId(attendance);
        let entry = {
          id;
          contractId;
          labourId;
          columnType;
          value;
        };
        attendance.add(id, entry);
        id;
      };
    };
  };

  public query ({ caller }) func getAttendanceForContract(contractId : Nat) : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view attendance");
    };
    attendance.values().toArray().filter(
      func(entry) { entry.contractId == contractId }
    ).sort();
  };

  // === ADVANCES ===

  public shared ({ caller }) func createAdvanceEntry(
    contractId : Nat,
    labourId : Nat,
    amount : Float,
    note : ?Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create advances");
    };

    switch (contracts.get(contractId), labours.get(labourId)) {
      case (null, _) { Runtime.trap("Invalid contract id") };
      case (_, null) { Runtime.trap("Invalid labour id") };
      case (?_, ?_) {
        let id = Entity.getNextId(advances);
        let entry = {
          id;
          contractId;
          labourId;
          amount;
          note;
          createdAt = TimeUtils.currentTimestamp();
        };
        advances.add(id, entry);
        id;
      };
    };
  };

  public query ({ caller }) func getAdvancesForContract(contractId : Nat) : async [Advance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view advances");
    };
    advances.values().toArray().filter(
      func(entry) { entry.contractId == contractId }
    ).sort();
  };

  // === CONTRACT DETAILS ===

  public query ({ caller }) func getContractDetails(contractId : Nat) : async ?ContractDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Runtime.trap("Unauthorized: Only guests, users, and admins can view contract details");
    };
    switch (contracts.get(contractId)) {
      case (null) { null };
      case (?contract) {
        let meshCols = meshColumns.values().toArray().filter(
          func(col) { col.contractId == contract.id }
        ).sort();
        ?{ contract; meshColumns = meshCols };
      };
    };
  };
};
