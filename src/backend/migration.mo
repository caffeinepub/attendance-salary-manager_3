import Map "mo:core/Map";

module {
  // Old Contract type (already with bedRate/paperRate fields)
  public type OldContract = {
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

  // New Contract type (identical to OldContract)
  public type NewContract = OldContract;

  // Perform no-op migration
  public func run(old : { var contracts : Map.Map<Nat, OldContract> }) : { var contracts : Map.Map<Nat, NewContract> } {
    { var contracts = old.contracts };
  };
};
