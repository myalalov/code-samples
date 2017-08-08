  @Effect()
  public createGradeSet$ = this.actions$
    .ofType(CREATE_GRADESET)
    .switchMap(({type, payload: {id, gradeSet}}) =>
      this.rest.createGradeSet(id, gradeSet)
        .catch((err) => Observable.of({error: true, data: err})))
    .switchMap((response: any) => response.error ? errorHandler(response.data)
      : Observable.of({type: READ_GRADESET_DONE, payload: response}));

  @Effect()
  public readGradeSet$ = this.actions$
    .ofType(READ_GRADESET)
    .switchMap(({type, payload: {id, date}}) => this.rest.readGradeSet(id, date))
    .map((payload) => ({type: READ_GRADESET_DONE, payload}));

  @Effect()
  public updateGradeSet$ = this.actions$
    .ofType(UPDATE_GRADESET)
    .switchMap(({type, payload: {id, date, gradeSet}}) =>
      this.rest.updateGradeSet(id, date, gradeSet)
        .catch((err) => Observable.of({error: true, data: err})))
    .switchMap((response: any) => response.error ? errorHandler(response.data)
      : Observable.of({type: READ_GRADESET_DONE, payload: response}));

  @Effect()
  public deleteGradeSet$ = this.actions$
    .ofType(DELETE_GRADESET)
    .switchMap(({type, payload: {id, date}}) => this.rest.deleteGradeSet(id, date))
    .map((payload) => ({type: DELETE_GRADESET_DONE, payload}));

  @Effect()
  public validateGradeSet$ = this.actions$
    .ofType(VALIDATE_GRADESET)
    .switchMap(({type, payload: {id, gradeSet}}) =>
      this.rest.validateGradeSet(id, gradeSet)
        .catch((err) => Observable.of({error: true, data: err})))
    .switchMap((response: any) => response.error ? errorHandler(response.data)
      : Observable.of({type: VALIDATE_GRADESET_DONE, payload: response}));
