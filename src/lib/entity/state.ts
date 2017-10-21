export enum ENTITY_STATE { HIDDEN, DRAFT, PUBLIC }
export function normalizeEntityState(state:string|number): ENTITY_STATE {
    return typeof(ENTITY_STATE[state]) === 'number' ? ENTITY_STATE[state] : ENTITY_STATE[ENTITY_STATE[state]]
}