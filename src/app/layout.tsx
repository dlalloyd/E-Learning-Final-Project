'use client';

import React, { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>E-Learning Adaptive System</title>
        <meta name="description" content="Personalised adaptive e-learning platform" />
      </head>
      <body>{children}</body>
    </html>
  );
}
