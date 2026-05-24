"use client";

import { SelectHTMLAttributes } from "react";

/** A native <select> that submits its enclosing <form> on change. Lives in a
 * client component so the `onChange` handler doesn't cross the server-component
 * boundary (Next.js 15 rejects event-handler props on elements rendered by
 * server components). Use inside a server-rendered <form action={serverAction}>.
 */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        e.currentTarget.form?.requestSubmit();
        props.onChange?.(e);
      }}
    />
  );
}
