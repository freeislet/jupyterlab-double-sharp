import * as React from 'react';
import cn from 'classnames';
import { VscChevronRight } from 'react-icons/vsc';

import { IChildrenProps, IDivProps } from '.';
import Collapsible from './collapsible';

/**
 * Accordion
 */

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

/**
 * Accordion Trigger
 */

export interface IAccordionTriggerContainerProps extends IDivProps {}

function AccordionTriggerContainer({
  className,
  children,
  ...props
}: IAccordionTriggerContainerProps) {
  const { active } = React.useContext(AccordionContext);

  return (
    <div
      className={cn(
        'jp-DoubleSharp-Accordion-trigger',
        { 'jp-mod-active': active },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
Accordion.TriggerContainer = AccordionTriggerContainer;

export interface IAccordionTriggerInnerProps extends IDivProps {}

function AccordionTriggerInner({
  className,
  onClick,
  children,
  ...props
}: IAccordionTriggerInnerProps) {
  const { toggleActive } = React.useContext(AccordionContext);

  return (
    <div
      className={cn('jp-DoubleSharp-Accordion-trigger-inner', className)}
      onClick={toggleActive}
      {...props}
    >
      {children}
      <VscChevronRight className="jp-DoubleSharp-Accordion-trigger-chevron" />
    </div>
  );
}
Accordion.TriggerInner = AccordionTriggerInner;

export interface IAccordionTriggerProps extends IDivProps {}

function AccordionTrigger({
  className,
  children,
  ...props
}: IAccordionTriggerProps) {
  return (
    <AccordionTriggerContainer className={className}>
      <AccordionTriggerInner {...props}>{children}</AccordionTriggerInner>
    </AccordionTriggerContainer>
  );
}
Accordion.Trigger = AccordionTrigger;

/**
 * Accordion Content
 */

export interface IAccordionContentProps extends IDivProps {}

function AccordionContent({
  className,
  children,
  ...props
}: IAccordionContentProps) {
  const { active } = React.useContext(AccordionContext);

  return (
    <Collapsible collapse={!active}>
      <div
        className={cn('jp-DoubleSharp-Accordion-content', className)}
        {...props}
      >
        {children}
      </div>
    </Collapsible>
  );
}
Accordion.Content = AccordionContent;
