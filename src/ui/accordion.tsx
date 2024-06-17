import * as React from 'react';
import cn from 'classnames';
import { FaChevronDown } from 'react-icons/fa';

import { IChildrenProps, IDivProps } from '.';
import Collapsible from './collapsible';

interface IAccordionContext {
  active: boolean;
  toggleActive: () => void;
}

const AccordionContext = React.createContext<IAccordionContext>({
  active: false,
  toggleActive: () => {}
});

export interface IAccordionProps extends IChildrenProps {
  initialActive?: boolean;
}

export default function Accordion({
  initialActive = false,
  children
}: IAccordionProps) {
  const [active, setActive] = React.useState(initialActive);
  const toggleActive = () => setActive(prevActive => !prevActive);
  const contextValue: IAccordionContext = { active, toggleActive };

  return (
    <AccordionContext.Provider value={contextValue}>
      {children}
    </AccordionContext.Provider>
  );
}

export interface IAccordionTriggerProps extends IDivProps {}

function AccordionTrigger({
  className,
  onClick,
  children,
  ...props
}: IAccordionTriggerProps) {
  const { active, toggleActive } = React.useContext(AccordionContext);

  return (
    <div
      className={cn(
        'jp-DoubleSharp-Accordion-trigger',
        { 'jp-mod-active': active },
        className
      )}
      onClick={toggleActive}
      {...props}
    >
      {children}
      <FaChevronDown />
    </div>
  );
}
Accordion.Trigger = AccordionTrigger;

export interface IAccordionTriggerContainerProps extends IDivProps {}

function AccordionTriggerContainer({
  className,
  children,
  ...props
}: IAccordionTriggerProps) {
  return (
    <div
      className={cn('jp-DoubleSharp-Accordion-trigger', className)}
      {...props}
    >
      {children}
    </div>
  );
}
Accordion.TriggerContainer = AccordionTriggerContainer;

export interface IAccordionContentProps extends IDivProps {}

function AccordionContent({ children, ...props }: IAccordionContentProps) {
  const { active } = React.useContext(AccordionContext);

  return (
    <Collapsible collapse={!active} {...props}>
      {children}
    </Collapsible>
  );
}
Accordion.Content = AccordionContent;
