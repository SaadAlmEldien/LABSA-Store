import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'LABSA | لَبسة — Admin Operations',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
