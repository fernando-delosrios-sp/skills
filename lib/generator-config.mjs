import { loadGlobalOverlay, hasOverlay, resolveGeneratorsForSkill } from './overlay-yaml.mjs';

export { GLOBAL_OVERLAY_PATH } from './overlay-yaml.mjs';
export {
  loadGlobalOverlay,
  resolveGeneratorsForSkill,
  getGeneratedPathsForSkill,
  isGeneratedPathForSkill,
  expectedContentForPath,
} from './overlay-yaml.mjs';

export async function validateGlobalOverlay() {
  const errors = [];
  try {
    await loadGlobalOverlay();
  } catch (err) {
    errors.push({ type: 'overlay', message: err.message });
  }
  return errors;
}

export async function validateSkillGenerators(skills) {
  const errors = [];

  for (const skill of skills) {
    if (!(await hasOverlay(skill.name))) continue;
    try {
      await resolveGeneratorsForSkill(skill.name);
    } catch (err) {
      errors.push({ type: 'overlay', message: err.message, skill: skill.name });
    }
  }

  return errors;
}

