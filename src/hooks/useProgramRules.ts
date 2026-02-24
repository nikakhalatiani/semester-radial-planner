import { useMemo } from 'react';

import type {
  CourseDefinition,
  CourseOffering,
  MastersProgramRule,
  SelectedOffering,
} from '../types';
import { evaluateProgramRule } from '../utils/creditCalculator';

interface UseProgramRulesInput {
  rule?: MastersProgramRule;
  selections: SelectedOffering[];
  offerings: CourseOffering[];
  definitions: CourseDefinition[];
  language?: 'en' | 'de';
}

export function useProgramRules({
  rule,
  selections,
  offerings,
  definitions,
  language = 'en',
}: UseProgramRulesInput) {
  return useMemo(() => {
    if (!rule) {
      return undefined;
    }

    return evaluateProgramRule({
      rule,
      selections,
      offerings,
      definitions,
      language,
    });
  }, [definitions, language, offerings, rule, selections]);
}
