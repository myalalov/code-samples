export class CalcError {
  constructor(
    public place: CalcErrorPlace,
    public type: CalcErrorType,
    public recommendation: string
  ) {}
}

export class CalcErrorsList extends Array<CalcError> {

  constructor() {
    super();
    Object.setPrototypeOf(this, CalcErrorsList.prototype);
  }

  public add( place: CalcErrorPlace, type: CalcErrorType, recommendation: string ): void {
    this.push( new CalcError( place, type, recommendation ) );
  }

}

export class CalcSubTotal {
  public value: number = -1;
  public errors: CalcErrorsList = new CalcErrorsList();
}

export class CalcTotal extends CalcSubTotal {
  public expertise: CalcSubTotal = new CalcSubTotal();
  public judgement: CalcSubTotal = new CalcSubTotal();
  public accountability: CalcSubTotal = new CalcSubTotal();
  public value: number = -1;
  public errors: CalcErrorsList = new CalcErrorsList();
}
