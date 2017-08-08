import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { formatDate } from '../../common/util/dates';

import { ClassLibListStructureItem, ClassLibListGradeSetItem, ClassLibList } from '../../common/model/classlib.model';
import { getLibraryAction } from '../../page-classlib/classification.action';
import { updateClassificationStructures, getClassificationStructures } from '../../common/store/action';

@Component({
  selector: 'classificationlibrary-component',
  styleUrls: ['./classliborg.component.scss'],
  templateUrl: './classliborg.component.html'
})

export class ClassLibOrgComponent implements OnChanges {

  @Input() public org;
  @Input() public permissions;

  public formatDate = formatDate;
  public originalStructures: any = [];
  public structures: ClassLibList;
  public activeGradeSet: ClassLibListGradeSetItem = null;
  public librarySubscription: Subscription;
  public searchText: string = '';
  public loading: boolean = true;

  constructor(public store: Store<any>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    const { org: { currentValue: currentOrg } } = changes;

    if (currentOrg && currentOrg.labels) {
      this.librarySubscription = this.store.select(this.getPermissions('u') ? 'classificationLibrary' : 'orgClassLib').subscribe((data) => {
        this.originalStructures = data;
        this.handleData();
      });
      this.store.dispatch(this.getPermissions('u') ? getLibraryAction() : getClassificationStructures(currentOrg._id));
    }
  }

  public getPermissions(flags) {
    if (flags === 'all') {
      return JSON.stringify(this.permissions);
    }
    const perm = this.permissions && this.permissions.value;
    return perm && flags.split('').some((flag) => perm.indexOf(flag) !== -1);
  }

  // Make list item for user with no update permissions
  public makeListItem(structure) {
    return new ClassLibListGradeSetItem({
      grades: structure.gradeSets[0].grades.map((item) => {item.mid = this.getMidValue(item); return item; }),
      parent: new ClassLibListStructureItem({
        _id: structure._id,
        name: structure.name,
        label: `${structure.shortName} (${formatDate(new Date(structure.gradeSets[0].effectiveDate))})`,
        selected: this.org.classificationStructures.indexOf(structure.name) !== -1
      }),
    });
  }

  public handleData() {
    this.structures = [];
    if (this.originalStructures && this.org) {
      this.originalStructures.forEach((structure) => {
        this.structures.push(this.makeListItem(structure));
      });
    }
  }

  public getMidValue(grade) {
    return grade && Math.trunc((grade.min + grade.max) / 2 + 1) || '';
  }

  // For user with update permissions
  public saveModel() {
    const enabledStructures = this.structures
      .filter((item: ClassLibListGradeSetItem) => item.parent.selected)
      .map((item: ClassLibListGradeSetItem) => item.parent._id);
    this.store.dispatch(updateClassificationStructures({ id: this.org._id, structures: enabledStructures }));
  }

  public onSelectStructure(structure) {
    structure.parent.selected = !structure.parent.selected;
  }

  public getFilterGradeItemValue(value) {
    const item: any = this.activeGradeSet.grades.filter((element) => element.min < value && element.max > value);
    return item.length > 0 ? this.getMidValue(item[0]) : null;
  }
}
