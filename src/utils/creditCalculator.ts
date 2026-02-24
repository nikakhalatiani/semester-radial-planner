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
  language?: 'en' | 'de';
}

const RULE_TEXT: Record<
  'en' | 'de',
  {
    mandatoryLabel: string;
    mandatoryMissing: string;
    totalCreditsLabel: string;
    lpShort: string;
    categoryMinLabel: string;
    lpAboveMax: string;
    electiveMinLabel: string;
    electiveShort: string;
    seminarLabel: string;
    seminarMissing: string;
    praktikumLabel: string;
    praktikumMissing: string;
    thesisLabel: string;
    thesisMissing: string;
  }
> = {
  en: {
    mandatoryLabel: 'All mandatory courses included',
    mandatoryMissing: '{count} mandatory courses missing',
    totalCreditsLabel: '{count} LP included',
    lpShort: '{count} LP short',
    categoryMinLabel: '{category}: min. {min} LP elective',
    lpAboveMax: '{count} LP above max',
    electiveMinLabel: '{count} LP elective minimum',
    electiveShort: '{count} LP elective short',
    seminarLabel: 'Min. {count} Seminar included',
    seminarMissing: '{count} seminar(s) missing',
    praktikumLabel: 'Min. {count} Praktikum included',
    praktikumMissing: '{count} praktikum missing',
    thesisLabel: 'Master thesis included',
    thesisMissing: 'Thesis not included',
  },
  de: {
    mandatoryLabel: 'Alle Pflichtmodule enthalten',
    mandatoryMissing: '{count} Pflichtmodule fehlen',
    totalCreditsLabel: '{count} LP enthalten',
    lpShort: '{count} LP fehlen',
    categoryMinLabel: '{category}: mind. {min} LP Wahlpflicht',
    lpAboveMax: '{count} LP ueber Maximum',
    electiveMinLabel: '{count} LP Wahlpflicht minimum',
    electiveShort: '{count} LP Wahlpflicht fehlen',
    seminarLabel: 'Mind. {count} Seminar enthalten',
    seminarMissing: '{count} Seminar fehlen',
    praktikumLabel: 'Mind. {count} Praktikum enthalten',
    praktikumMissing: '{count} Praktikum fehlen',
    thesisLabel: 'Masterarbeit enthalten',
    thesisMissing: 'Masterarbeit nicht enthalten',
  },
};

function formatText(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

export function evaluateProgramRule({
  rule,
  selections,
  offerings,
  definitions,
  language = 'en',
}: EvaluationInput): RuleEvaluationResult {
  const text = RULE_TEXT[language];
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
      label: text.mandatoryLabel,
      met: includedMandatory.size === mandatorySet.size,
      details:
        includedMandatory.size === mandatorySet.size
          ? undefined
          : formatText(text.mandatoryMissing, {
              count: mandatorySet.size - includedMandatory.size,
            }),
    },
    {
      id: 'total-credits',
      label: formatText(text.totalCreditsLabel, { count: rule.totalCreditsRequired }),
      met: applicableCredits >= rule.totalCreditsRequired,
      details:
        applicableCredits >= rule.totalCreditsRequired
          ? undefined
          : formatText(text.lpShort, { count: rule.totalCreditsRequired - applicableCredits }),
    },
    ...rule.categoryRequirements.map((requirement) => {
      const categoryCredits = electiveDefinitions
        .filter((definition) => definition.category === requirement.category)
        .reduce((sum, definition) => sum + definition.credits, 0);
      const maxValid = requirement.maxCredits == null || categoryCredits <= requirement.maxCredits;
      const minValid = categoryCredits >= requirement.minCredits;
      const met = minValid && maxValid;
      const label =
        requirement.label ??
        formatText(text.categoryMinLabel, {
          category: requirement.category,
          min: requirement.minCredits,
        });

      let details: string | undefined;
      if (!minValid) {
        details = formatText(text.lpShort, { count: requirement.minCredits - categoryCredits });
      } else if (!maxValid && requirement.maxCredits != null) {
        details = formatText(text.lpAboveMax, { count: categoryCredits - requirement.maxCredits });
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
      label: formatText(text.electiveMinLabel, { count: rule.electiveCreditsMin }),
      met: electiveCredits >= rule.electiveCreditsMin,
      details:
        electiveCredits >= rule.electiveCreditsMin
          ? undefined
          : formatText(text.electiveShort, { count: rule.electiveCreditsMin - electiveCredits }),
    },
    {
      id: 'seminar',
      label: formatText(text.seminarLabel, { count: rule.seminarMinCount }),
      met: seminarCount >= rule.seminarMinCount,
      details:
        seminarCount >= rule.seminarMinCount
          ? undefined
          : formatText(text.seminarMissing, { count: rule.seminarMinCount - seminarCount }),
    },
    {
      id: 'praktikum',
      label: formatText(text.praktikumLabel, { count: rule.praktikumMinCount }),
      met: praktikumCount >= rule.praktikumMinCount,
      details:
        praktikumCount >= rule.praktikumMinCount
          ? undefined
          : formatText(text.praktikumMissing, { count: rule.praktikumMinCount - praktikumCount }),
    },
    {
      id: 'thesis',
      label: text.thesisLabel,
      met: !rule.thesisRequired || thesisIncluded,
      details: !rule.thesisRequired || thesisIncluded ? undefined : text.thesisMissing,
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
