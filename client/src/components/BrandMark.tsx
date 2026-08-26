import React from "react";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** Le panier EASYSTOR est le seul symbole employé pour la marque. */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      data-brand-mark="easystor"
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M200 117h112v38H200zm-40 35h192l-17 214H177zm38 41 9 132h98l9-132z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
