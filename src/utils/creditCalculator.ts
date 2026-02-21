import type {
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  RuleEvaluationResult,
  SelectedOffering,
} from '../types';

interface EvaluationInput {
  rule: MastersProgramRule;
  selections: SelectedOffering[];
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
}

export function evaluateProgramRule({
  rule,
  selections,
  offerings,
  definitions,
}: EvaluationInput): RuleEvaluationResult {
  const offeringById = new Map(offerings.map((offering) => [offering.id, offering]));
  const definitionById = new Map(definitions.map((definition) => [definition.id, definition]));

  const includedDefinitions = selections
    .filter((selection) => selection.isIncluded)
    .map((selection) => {
      const offering = offeringById.get(selection.offeringId);
      return offering ? definitionById.get(offering.courseDefinitionId) : undefined;
    })
    .filter((definition): definition is CourseDefinition => Boolean(definition));

  const applicableCredits = includedDefinitions.reduce((sum, definition) => sum + definition.credits, 0);

  const mandatorySet = new Set(rule.mandatoryCourseDefinitionIds);
  const includedMandatory = new Set(
    includedDefinitions.filter((definition) => mandatorySet.has(definition.id)).map((definition) => definition.id),
  );

  const electiveDefinitions = includedDefinitions.filter((definition) => !mandatorySet.has(definition.id));
  const electiveCredits = electiveDefinitions.reduce((sum, definition) => sum + definition.credits, 0);

  const seminarCount = includedDefinitions.filter((definition) => definition.isSeminar).length;
  const praktikumCount = includedDefinitions.filter((definition) =>
    definition.tags?.some((tag) => tag.toLowerCase() === 'praktikum'),
  ).length;
  const thesisIncluded = includedDefinitions.some((definition) =>
    definition.tags?.some((tag) => tag.toLowerCase() === 'thesis'),
  );

  const rows = [
    {
      id: 'mandatory',
      label: 'All mandatory courses included',
      met: includedMandatory.size === mandatorySet.size,
      details:
        includedMandatory.size === mandatorySet.size
          ? undefined
          : `${mandatorySet.size - includedMandatory.size} mandatory courses missing`,
    },
    {
      id: 'total-credits',
      label: `${rule.totalCreditsRequired} LP included`,
      met: applicableCredits >= rule.totalCreditsRequired,
      details:
        applicableCredits >= rule.totalCreditsRequired
          ? undefined
          : `${rule.totalCreditsRequired - applicableCredits} LP short`,
    },
    ...rule.categoryRequirements.map((requirement) => {
      const categoryCredits = electiveDefinitions
        .filter((definition) => definition.category === requirement.category)
        .reduce((sum, definition) => sum + definition.credits, 0);
      const maxValid = requirement.maxCredits == null || categoryCredits <= requirement.maxCredits;
      const minValid = categoryCredits >= requirement.minCredits;
      const met = minValid && maxValid;
      const label = requirement.label ?? `${requirement.category}: min. ${requirement.minCredits} LP elective`;

      let details: string | undefined;
      if (!minValid) {
        details = `${requirement.minCredits - categoryCredits} LP short`;
      } else if (!maxValid && requirement.maxCredits != null) {
        details = `${categoryCredits - requirement.maxCredits} LP above max`;
      }

      return {
        id: `category-${requirement.category}`,
        label,
        met,
        details,
      };
    }),
    {
      id: 'elective-min',
      label: `${rule.electiveCreditsMin} LP elective minimum`,
      met: electiveCredits >= rule.electiveCreditsMin,
      details:
        electiveCredits >= rule.electiveCreditsMin
          ? undefined
          : `${rule.electiveCreditsMin - electiveCredits} LP elective short`,
    },
    {
      id: 'seminar',
      label: `Min. ${rule.seminarMinCount} Seminar included`,
      met: seminarCount >= rule.seminarMinCount,
      details:
        seminarCount >= rule.seminarMinCount
          ? undefined
          : `${rule.seminarMinCount - seminarCount} seminar(s) missing`,
    },
    {
      id: 'praktikum',
      label: `Min. ${rule.praktikumMinCount} Praktikum included`,
      met: praktikumCount >= rule.praktikumMinCount,
      details:
        praktikumCount >= rule.praktikumMinCount
          ? undefined
          : `${rule.praktikumMinCount - praktikumCount} praktikum missing`,
    },
    {
      id: 'thesis',
      label: 'Masterarbeit included',
      met: !rule.thesisRequired || thesisIncluded,
      details: !rule.thesisRequired || thesisIncluded ? undefined : 'Thesis not included',
    },
  ];

  const metRequirements = rows.filter((row) => row.met).length;

  return {
    applicableCredits,
    metRequirements,
    totalRequirements: rows.length,
    rows,
  };
}
