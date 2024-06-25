import * as React from 'react';

export interface IChildrenProps {
  children?: React.ReactNode;
}

export type IDivProps = React.HTMLAttributes<HTMLDivElement> & IChildrenProps;
export type IButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  IChildrenProps;
export type IInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  IChildrenProps;
export type ISVGProps = React.SVGAttributes<SVGElement>;
