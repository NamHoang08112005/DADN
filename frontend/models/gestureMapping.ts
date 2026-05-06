export type ActionType =
  | 'fan_on'
  | 'fan_off'
  | 'fan_speed_up'
  | 'fan_speed_down'
  | 'light_on'
  | 'light_off'
  | 'light_color';

export interface Mapping {
  id: string;
  gesture_name: string;
  action_type: ActionType;
  action_value?: number | string | null;
  is_active: boolean;
  created_at?: string; // new field
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';


export const fetchMappings = async (): Promise<Mapping[]> => {
  const res = await fetch(`${API_BASE_URL}/gesture/gesture-mapping`);
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch error: ', text);
    throw new Error(text || 'Failed to fetch mappings');
  }

  const json = await res.json();
  const data = Array.isArray(json) ? json : json.data ?? [];

  return data;

  //return res.json();
};

export const createMapping = async (mapping: Partial<Mapping>) => {
  const res = await fetch(`${API_BASE_URL}/gesture/gesture-mapping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapping),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Create error: ', text);
    throw new Error(text || 'Failed to create mapping');
  }

  const json = await res.json();
  const data = Array.isArray(json) ? json : json.data ?? [];

  return data;

  //return res.json();
};

export const updateMapping = async (id: string, mapping: Partial<Mapping>) => {
  const res = await fetch(`${API_BASE_URL}/gesture/gesture-mapping/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapping),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Update error: ', text);
    throw new Error(text || 'Failed to update mapping');
  };

  const json = await res.json();
  const data = Array.isArray(json) ? json : json.data ?? [];

  return data;

  //return res.json();
};

export const deleteMapping = async (id: string) => {
  const res = await fetch(`${API_BASE_URL}/gesture/gesture-mapping/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Delete error: ', text);
    throw new Error(text || 'Failed to delete mapping');
  }

  const json = await res.json();
  const data = Array.isArray(json) ? json : json.data ?? [];

  return data;
};
