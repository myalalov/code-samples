import { Pipe, PipeTransform } from '@angular/core';

import { ClassLibGrade, ClassLibListGradeSetItem } from '../../model/classlib.model';

@Pipe({
  name: 'myGradeSorter',
  pure: false
})
export class GradeSorterPipe implements PipeTransform {

  public getMidValue(grade) {
    return Math.trunc(( +grade.min + +grade.max ) / 2 + 1) || 0;
  }

  public transform(gradeSet: ClassLibListGradeSetItem): any {
    if (!gradeSet) {
      return [];
    }
    return gradeSet.grades.sort((gradeA: ClassLibGrade, gradeB: ClassLibGrade) => {
      const midA = this.getMidValue(gradeA);
      const midB = this.getMidValue(gradeB);
      return midA < midB ? 1 : ( midA > midB ? -1 : 0 );
    });
  }

}
