import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationTypeRepository } from '@/shared/api/repositories/locationTypeRepository';
import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
} from '@/entities/locationType';

const TYPES_KEY   = ['locationTypes'] as const;
const CONTAIN_KEY = ['locationContainmentRules'] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export function useLocationTypes() {
  return useQuery({
    queryKey: TYPES_KEY,
    queryFn: locationTypeRepository.listTypes,
  });
}

export function useSaveLocationType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: LocationTypeEntry) => locationTypeRepository.saveType(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: TYPES_KEY }),
  });
}

export function useDeleteLocationType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationTypeRepository.deleteType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TYPES_KEY });
      qc.invalidateQueries({ queryKey: CONTAIN_KEY });
    },
  });
}

// ── Containment rules ─────────────────────────────────────────────────────────

export function useContainmentRules() {
  return useQuery({
    queryKey: CONTAIN_KEY,
    queryFn: locationTypeRepository.listContainmentRules,
  });
}

export function useSaveContainmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: LocationTypeContainmentRule) => locationTypeRepository.saveContainmentRule(rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTAIN_KEY }),
  });
}

export function useDeleteContainmentRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => locationTypeRepository.deleteContainmentRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONTAIN_KEY }),
  });
}
