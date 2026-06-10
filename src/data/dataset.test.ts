import { Ajv2020 } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import devicesSchema from '../../schemas/devices.schema.json';
import { resolveConstraint } from '../features/profiles/constraintResolver';
import type { ConstraintDataset, DeviceDataset } from '../features/profiles/profile.types';
import constraintsJson from './constraints.json';
import devicesJson from './devices.json';

const devices = devicesJson as DeviceDataset;
const constraints = constraintsJson as ConstraintDataset;
const allProfiles = [...devices.curated, ...devices.measured];

describe('devices.json', () => {
  it('matches the JSON schema', () => {
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(devicesSchema);

    const isValid = validate(devicesJson);

    expect(validate.errors ?? []).toEqual([]);
    expect(isValid).toBe(true);
  });

  it('has a unique id for every profile', () => {
    const ids = allProfiles.map((profile) => profile.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has screen dimensions consistent with the declared orientation', () => {
    for (const profile of allProfiles) {
      const { width, height } = profile.screen;
      const matchesOrientation =
        profile.orientation === 'landscape' ? width >= height : height >= width;

      expect(
        matchesOrientation,
        `${profile.id}: ${width}×${height} vs ${profile.orientation}`,
      ).toBe(true);
    }
  });

  it('resolves every enabled constraint of every profile to a measurement', () => {
    for (const profile of allProfiles) {
      for (const constraintId of profile.constraints) {
        const resolved = resolveConstraint(constraintId, profile, constraints);

        expect(resolved, `${profile.id}: "${constraintId}" did not resolve`).not.toBeNull();
      }
    }
  });

  it('only overrides constraints the profile actually enables', () => {
    for (const profile of allProfiles) {
      const overriddenIds = Object.keys(profile.constraintOverrides ?? {});

      for (const overriddenId of overriddenIds) {
        expect(
          profile.constraints,
          `${profile.id}: override for "${overriddenId}" has no matching constraint`,
        ).toContain(overriddenId);
      }
    }
  });
});
