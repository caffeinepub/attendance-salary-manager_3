import Map "mo:core/Map";

module Migration {
  // Old Contract type (before bedRate/paperRate fields)
  public type OldContract = {
    id : Nat;
    name : Text;
    multiplier : Float;
    contractAmount : Float;
    machineExp : Float;
    isSettled : Bool;
    createdAt : Int;
  };

  // New Contract type (with bedRate/paperRate fields)
  public type NewContract = {
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

  public func migration(
    old : { var contracts : Map.Map<Nat, OldContract> }
  ) : { var contracts : Map.Map<Nat, NewContract> } {
    let newContracts = Map.empty<Nat, NewContract>();
    for ((id, c) in old.contracts.entries()) {
      newContracts.add(id, {
        id = c.id;
        name = c.name;
        multiplier = c.multiplier;
        contractAmount = c.contractAmount;
        machineExp = c.machineExp;
        bedRate = null;
        paperRate = null;
        isSettled = c.isSettled;
        createdAt = c.createdAt;
      });
    };
    { var contracts = newContracts };
  };
}
