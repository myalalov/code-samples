  describe(`should calculate points correctly`, () => {

    scenarios.forEach( ( scenario ) => {

      /*  Example:

          90262, 'Deputy Chief Executive',
          'G4+e-', 'G', '4+', 'e-', 409,
          'E+5', 'E+', '5', 373,
          'F5c', 'F', '5', 'c', 622,
          1404,
          '407m-OPR/CAP Expenditure', 407, 'm', 'Direct', 'Direct',
          '28.05.2015', '11.02.2016' ];

      */

      //noinspection JSUnusedLocalSymbols
      const [
        scenarioId, roleName,
        expertiseFullDesignation, expertiseKnowledgeAndExperience, expertiseBreadth, expertiseInterpersonalSkills, expertiseExpectedSubTotal,
        judgementFullDesignation, judgementJobEnvironment, judgementReasoning, judgementExpectedSubTotal,
        accountabilityFullDesignation, accountabilityIndependenceAndInfluence, accountabilityImpact, accountabilityInvolvement, accountabilityExpectedSubTotal,
        expectedTotal,
        accountabilityImpactType, accountabilityImpactValue, accountabilityImpactValueDimension, accountabilityFocus, accountabilityImpactTypeDirectOrIndirect,
        createdDate, modifiedDate
      ] = scenario;

      it(`scenario ${scenarioId}, role "${roleName}"`, () => {

        let accountabilityImpactTypeName = '' + accountabilityImpactType;
        let accountabilityImpactTypeKey = '';
        if ( accountabilityImpactTypeName.indexOf( 'Expenditure' ) !== -1 ) {
          accountabilityImpactTypeName = 'Expenditure';
        }
        if ( accountabilityImpactTypeName.indexOf( 'Sales/Revenue' ) !== -1 ) {
          accountabilityImpactTypeName = 'Sales/Revenue';
        }
        if ( accountabilityImpactTypeName === 'Service' || accountabilityImpactTypeName === 'Advice' ) {
          accountabilityImpactTypeName = '';
        } else {
          calculatorImpactTables.forEach( ( impTable ) => {
            if ( impTable.name === accountabilityImpactTypeName || impTable.key === accountabilityImpactTypeName ) {
              accountabilityImpactTypeKey = impTable.key;
            }
          } );
        }

        const testData = {
          expertise: {
            knowledgeAndExperience: '' + expertiseKnowledgeAndExperience,
            breadth: '' + expertiseBreadth,
            interpersonalSkills: '' + expertiseInterpersonalSkills
          },
          judgement: {
            jobEnvironment: '' + judgementJobEnvironment,
            reasoning: '' + judgementReasoning
          },
          accountability: {
            focus: '' + accountabilityFocus,
            effectiveYear: 2017,
            impactType: '' + accountabilityImpactTypeKey,
            impactValue: '' + accountabilityImpactValue,
            impactValueDimension: '' + accountabilityImpactValueDimension,
            independenceAndInfluence: '' + accountabilityIndependenceAndInfluence,
            impact: '' + accountabilityImpact,
            involvement: '' + accountabilityInvolvement
          }
        };
        const total = Calculator.getPoints( testData, 'Australia' );

        const significantErrorsCount = Calculator.isThereSignificantErrors( total.errors );

        if ( significantErrorsCount ) {
          expect( 'Errors list: ' + JSON.stringify( total.errors ) ).toEqual( 'empty list' );
        } else {
          expect( 'expertise subtotal ' + total.expertise.value ).toEqual( 'expertise subtotal ' + expertiseExpectedSubTotal );
          expect( 'judgement subtotal ' + total.judgement.value ).toEqual( 'judgement subtotal ' + judgementExpectedSubTotal );
          expect( 'accountability subtotal ' + total.accountability.value ).toEqual( 'accountability subtotal ' + accountabilityExpectedSubTotal );
          expect( 'total ' + total.value ).toEqual( 'total ' + expectedTotal );
        }
      });

    } );

  });
