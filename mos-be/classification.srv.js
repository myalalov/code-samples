const OrganizationService = require('./organization.srv');

const { ClassificationModel } = require('../model');

class ClassificationService {

  constructor() {
    this.Entity = ClassificationModel;
    this.organizationService = new OrganizationService();
  }

  getLibrary() {
    return this.Entity.find({});
  }

  getOrganizationStructures(orgId) {
    return Promise.resolve(this.organizationService.getClassificationStructures(orgId))
      .then(ids => Promise.resolve(this.Entity.find({ _id: { $in: ids } }))
          .then((structures) => {
            structures.forEach((structure) => {
              structure.gradeSets = structure.gradeSets.filter(gradeSet => gradeSet.primary);
            });
            return structures;
          }));
  }

  createStructure(structure) {
    return Promise.resolve(this.Entity.create(structure));
  }

  readStructure(id) {
    return Promise.resolve(this.Entity.findById(id));
  }

  updateStructure(id, structure) {
    console.log(structure);
    return Promise.resolve(this.Entity.findByIdAndUpdate(id, structure, { upsert: false }))
      .then(() => this.readStructure(id));
  }

  deleteStructure(ids) {
    return this.organizationService.checkClassificationStructuresAreUsed(ids).then((areUsed) => {
      if (areUsed) {
        return { error: 'Some of selected structures are used in organizations' };
      }
      return Promise.resolve(this.Entity.remove({ _id: { $in: ids } })).then(() => ({ ids: ids.join('-') }));
    });
  }

  indexOfGradeSet(structure, date) {
    return structure.gradeSets.reduce((r, set, i) => set.effectiveDate === date ? i : r, -1);
  }

  createGradeSet(id, gradeSet) {
    return this.readStructure(id).then((structure) => {
      const existing = this.indexOfGradeSet(structure, gradeSet.effectiveDate);
      if (existing !== -1) return { error: `Grade set for this effective date already exists: ${gradeSet.effectiveDate}` };

      if (gradeSet.name) {
        structure.name = gradeSet.name;
        delete gradeSet.name;
      }
      structure.gradeSets.push(gradeSet);

      return this.updateStructure(id, structure).then((updatedStructure) => {
        const created = this.indexOfGradeSet(updatedStructure, gradeSet.effectiveDate);
        return Promise.resolve(updatedStructure.gradeSets[created]);
      });
    });
  }

  readGradeSet(id, date) {
    return this.readStructure(id).then((structure) => {
      const index = this.indexOfGradeSet(structure, date);
      if (index === -1) return { error: `No grade set with effective date ${date}` };

      return Promise.resolve(structure.gradeSets[index]);
    });
  }

  updateGradeSet(id, date, gradeSet) {
    return this.readStructure(id).then((structure) => {
      const index = this.indexOfGradeSet(structure, date);
      if (index === -1) return { error: `No grade set for this effective date: ${date}` };

      if (gradeSet.name !== undefined) {
        structure.name = gradeSet.name;
        delete gradeSet.name;
      }

      if (gradeSet.shortName !== undefined) {
        structure.shortName = gradeSet.shortName;
        delete gradeSet.shortName;
      }

      structure.gradeSets[index] = gradeSet;

      if (gradeSet.primary) {
        structure.gradeSets.forEach((item, i) => {
          item.primary = i === index;
        });
      }

      return this.updateStructure(id, structure).then((updatedStructure) => {
        const updated = this.indexOfGradeSet(updatedStructure, gradeSet.effectiveDate);
        return Promise.resolve(updatedStructure.gradeSets[updated]);
      });
    });
  }

  deleteGradeSet(id, date) {
    return this.readStructure(id).then((structure) => {
      const index = this.indexOfGradeSet(structure, date);
      if (index === -1) return { error: `No grade set for this effective date: ${date}` };

      if (structure.gradeSets.length === 1) return { error: 'Only version cannot be deleted, try to delete whole classification structure' };

      if (structure.gradeSets[index].primary) return { error: 'Primary version cannot be deleted' };

      structure.gradeSets.splice(index, 1);

      return this.updateStructure(id, structure).then(() => Promise.resolve({ id, date }));
    });
  }

  validateGradeSet(id, gradeSet) {
    const messages = [];

    if (gradeSet.primary !== true && gradeSet.primary !== false) {
      messages.push('Primary is not boolean');
    }

    if (isNaN(+new Date(gradeSet.effectiveDate))) {
      messages.push('Effective date is invalid');
    }

    if (!Array.isArray(gradeSet.grades)) {
      messages.push('Grades is not an array');
    } else {
      if (!gradeSet.grades.length) {
        messages.push('Grade list is empty');
      }
      const grades = gradeSet.grades.sort((gradeA, gradeB) => gradeA.min < gradeB.min ? -1 : (gradeA.min > gradeB.min ? 1 : 0));

      const titles = gradeSet.grades.reduce((map, item) => {
        map[item.title] = true;
        return map;
      }, {});
      if (Object.keys(titles).length !== gradeSet.grades.length) {
        messages.push('There are equal titles of grades');
      }

      gradeSet.grades.forEach((grade, i) => {
        if (+grade.min < 0) {
          messages.push(`Value cannot be negative in "${grade.title}"`);
          return;
        }
        if (+grade.max <= +grade.min) {
          messages.push(`Max value must be greaer than min value in "${grade.title}"`);
          return;
        }
        if (i === 0) {
          return;
        }
        const prev = grades[i - 1];
        if (+grade.min < +prev.max) {
          messages.push(`Grades intervals are intercepted for "${prev.title}" and "${grade.title}"`);
          return;
        }
        if (+grade.min > +prev.max + 1) {
          messages.push(`There is a gap between "${prev.title}" and "${grade.title}"`);
        }
      });
    }
    return Promise.resolve(messages);
  }
}

module.exports = ClassificationService;
