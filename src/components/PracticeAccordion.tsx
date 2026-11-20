import * as Accordion from '@radix-ui/react-accordion';
type Practice = {
  id: string;
  title: string;
  paragraphs: string[];
  href: string;
};
export default function PracticeAccordion({
  items,
  more,
}: {
  items: Practice[];
  more: string;
}) {
  return (
    <Accordion.Root type="multiple" className="practice-accordion">
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id} className="practice-item">
          <Accordion.Header className="practice-heading">
            <Accordion.Trigger className="practice-trigger">
              {item.title}
              <span className="practice-icon" aria-hidden="true">
                <span />
                <span />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="practice-content">
            <div className="practice-content-inner">
              {item.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <a className="text-link" href={item.href}>
                {more}
              </a>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
