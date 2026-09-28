import type { ComponentProps } from 'react';
import { Input } from './input';

export function DatePicker(props: ComponentProps<typeof Input>) {
  return <Input type="date" {...props} />;
}
