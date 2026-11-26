'use client';

import { DayPicker, type DayPickerProps } from 'react-day-picker';
import 'react-day-picker/style.css';

// A month grid in the app's colours (see globals.css)
export function Calendar(props: DayPickerProps) {
  return <DayPicker className="calendar" {...props} />;
}
