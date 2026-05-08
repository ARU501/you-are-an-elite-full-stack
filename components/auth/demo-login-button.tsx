"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, ButtonProps } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export function DemoLoginButton(props: ButtonProps) {
  const router = useRouter();
  const demoLogin = useAppStore((state) => state.demoLogin);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      {...props}
      disabled={isPending || props.disabled}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        startTransition(() => {
          demoLogin();
          router.push("/dashboard");
        });
      }}
    />
  );
}
