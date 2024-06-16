import * as React from 'react';

export interface IChildrenProps {
  children?: React.ReactNode;
}

export type IDivChildrenProps = IDivProps & IChildrenProps;

export type IDivProps = React.HTMLAttributes<HTMLDivElement>;
export type IButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export type IInputProps = React.InputHTMLAttributes<HTMLInputElement>;
