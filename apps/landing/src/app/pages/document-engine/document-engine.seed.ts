import type { EditorDocument } from '@portfolio/shared/features/rte-core';

// Documents carry the schema version they were authored against. Hardcoding 1
// here (rather than importing LATEST_SCHEMA_VERSION) keeps `document-engine-core`
// out of this page's import graph: the editor migrates the doc on the way in, so
// an older seed stays correct after a future schema bump.
const SCHEMA_VERSION = 1;

type Node = Record<string, unknown>;

function text(value: string, ...marks: string[]): Node {
  return marks.length
    ? { type: 'text', text: value, marks: marks.map((type) => ({ type })) }
    : { type: 'text', text: value };
}

function link(value: string, href: string): Node {
  return { type: 'text', text: value, marks: [{ type: 'link', attrs: { href, target: '_blank' } }] };
}

/**
 * A real `dynamicField` node — inline, atomic, carrying its own id and label.
 *
 * This is the difference the page claims, made literal. Writing `{{loan_amount}}`
 * as ordinary text would look identical on screen and be a completely different
 * document: the JSON panel would show a string, and every consumer downstream
 * would need a regex and a prayer to find the placeholders again. Here the
 * panel shows a node, and a merge step is a tree walk.
 */
function field(fieldId: string, label: string): Node {
  return { type: 'dynamicField', attrs: { fieldId, label } };
}

function paragraph(...content: Node[]): Node {
  return { type: 'paragraph', content };
}

function heading(level: number, value: string): Node {
  return { type: 'heading', attrs: { level }, content: [text(value)] };
}

/**
 * Numbered list. NOT `orderedList`.
 *
 * The engine replaces TipTap's ordered list with its own `customOrderedList`,
 * which extends it with a list-style attribute — legal numbering runs to
 * `(a)`/`(iv)`, which plain `<ol>` cannot express. The node name is therefore
 * engine vocabulary rather than portable vocabulary, and a document written with
 * `orderedList` is rejected outright: ProseMirror throws `Unknown node type` and
 * the editor renders empty rather than partially. Worth knowing before authoring
 * any seed by hand.
 */
function orderedList(...content: Node[]): Node {
  return { type: 'customOrderedList', content };
}

function item(...content: Node[]): Node {
  return { type: 'listItem', content: [paragraph(...content)] };
}

function cell(...content: Node[]): Node {
  return { type: 'tableCell', content: [paragraph(...content)] };
}

function headerCell(value: string): Node {
  return { type: 'tableHeader', content: [paragraph(text(value, 'bold'))] };
}

/**
 * Starting document for the live demo: a facility agreement.
 *
 * Deliberately a real document rather than filler. Two reasons. The first is
 * that the page's whole argument is about documents that *matter* — the ones
 * with money and obligations in them — and lorem ipsum quietly concedes that
 * argument before the reader has finished the first band. The second is
 * coverage: a genuine agreement naturally wants headings, an ordered list of
 * numbered clauses, a definitions list, a schedule as a table, emphasis on the
 * terms being defined, a cross-reference link, a quoted statutory line and a
 * dozen merge fields. Written honestly, it exercises very nearly every node and
 * mark the engine ships, without a single element being there just to be shown.
 *
 * Generic on purpose. These are the clauses any lender's facility letter carries;
 * nothing here is specific to a client, a product or an internal system.
 */
export const SEED_DOCUMENT: EditorDocument = {
  schemaVersion: SCHEMA_VERSION,
  content: {
    type: 'doc',
    content: [
      heading(2, 'Facility agreement'),

      paragraph(
        text('This agreement is made on '),
        field('agreement_date', 'Agreement date'),
        text(' between '),
        field('lender_name', 'Lender'),
        text(' (the '),
        text('Lender', 'bold'),
        text(') and '),
        field('customer_name', 'Customer name'),
        text(' of '),
        field('customer_address', 'Address'),
        text(' (the '),
        text('Borrower', 'bold'),
        text(').')
      ),

      heading(3, '1. The facility'),

      paragraph(
        text('The Lender agrees to make available to the Borrower a term loan of '),
        field('loan_amount', 'Loan amount'),
        text(' for a period of '),
        field('loan_term', 'Term'),
        text(' from '),
        field('start_date', 'Effective from'),
        text(', on the terms set out below.')
      ),

      orderedList(
        item(
          text('Interest accrues daily at '),
          field('interest_rate', 'Interest rate'),
          text(' per annum, calculated on the outstanding principal.')
        ),
        item(
          text('Repayments fall due monthly in arrears, in the amounts set out in the '),
          text('Schedule', 'italic'),
          text(' below.')
        ),
        item(
          text('The Borrower may prepay in whole or in part at any time '),
          text('without penalty', 'bold'),
          text(', on five business days’ written notice.')
        )
      ),

      heading(3, '2. Conditions precedent'),

      paragraph(
        text(
          'The Lender’s obligation to advance is subject to receipt of each of the following, in form satisfactory to it:'
        )
      ),

      {
        type: 'bulletList',
        content: [
          item(text('a certified copy of the Borrower’s constitutional documents;')),
          item(text('evidence of the insurances required under clause 4;')),
          item(
            text('a completed direct debit instruction for account '),
            field('account_number', 'Account number'),
            text(';')
          ),
          item(text('the fee referred to in '), text('clause 3.2', 'italic'), text(', paid in cleared funds.')),
        ],
      },

      heading(3, '3. Repayment schedule'),

      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              headerCell('Instalment'),
              headerCell('Due date'),
              headerCell('Principal'),
              headerCell('Interest'),
            ],
          },
          {
            type: 'tableRow',
            content: [
              cell(text('1')),
              cell(field('start_date', 'Effective from')),
              cell(field('loan_amount', 'Loan amount')),
              cell(field('interest_rate', 'Interest rate')),
            ],
          },
          {
            type: 'tableRow',
            content: [cell(text('2')), cell(text('as advised')), cell(text('as advised')), cell(text('as advised'))],
          },
          {
            type: 'tableRow',
            content: [cell(text('…')), cell(text('…')), cell(text('…')), cell(text('…'))],
          },
        ],
      },

      { type: 'horizontalRule' },

      heading(3, '4. Representations'),

      paragraph(
        text('The Borrower represents that the information supplied in its '),
        text('application', 'underline'),
        text(' is true and complete, and that no '),
        text('event of default', 'italic'),
        text(' as defined in clause 9 is continuing.')
      ),

      {
        type: 'blockquote',
        content: [
          paragraph(
            text(
              'Nothing in this agreement excludes or limits any liability that cannot lawfully be excluded or limited.'
            )
          ),
        ],
      },

      heading(3, '5. Notices'),

      paragraph(
        text('Notices to the Lender must be sent to '),
        field('lender_email', 'Lender email'),
        text(', quoting reference '),
        text('DE-', 'code'),
        field('customer_id', 'Customer ID'),
        text('. The current notice address is published at '),
        link('the Lender’s website', 'https://example.com/contact'),
        text('.')
      ),

      paragraph(
        text('Clause 6 (Set-off) has been ', 'italic'),
        text('deleted by agreement', 'strike'),
        text(' and is of no effect.', 'italic')
      ),

      { type: 'horizontalRule' },

      paragraph(text('Signed for and on behalf of the Borrower:')),
      paragraph(field('customer_name', 'Customer name'), text('  ·  '), field('agreement_date', 'Agreement date')),
    ],
  },
};

/**
 * The second document, loaded by the "template" preset.
 *
 * Short on purpose: it is there to show that swapping the document is a value
 * change and nothing more, and a second long agreement would only prove that
 * twice. This one is the arrears notice the same system would send later —
 * different document, same fields, same store.
 */
export const TEMPLATE_DOCUMENT: EditorDocument = {
  schemaVersion: SCHEMA_VERSION,
  content: {
    type: 'doc',
    content: [
      heading(2, 'Notice of arrears'),

      paragraph(text('Dear '), field('customer_name', 'Customer name'), text(',')),

      paragraph(
        text('Our records show that the payment due on your facility '),
        field('customer_id', 'Customer ID'),
        text(' has not been received. As at today the outstanding balance is '),
        field('loan_amount', 'Loan amount'),
        text('.')
      ),

      paragraph(text('To bring the account up to date, please either:')),

      {
        type: 'bulletList',
        content: [
          item(text('pay the arrears in full by '), field('start_date', 'Effective from'), text('; or')),
          item(text('contact us at '), field('lender_email', 'Lender email'), text(' to agree an arrangement.')),
        ],
      },

      {
        type: 'blockquote',
        content: [paragraph(text('This is a formal notice. Please do not ignore it.', 'bold'))],
      },

      paragraph(text('Yours sincerely,')),
      paragraph(field('lender_name', 'Lender')),
    ],
  },
};

/**
 * A blank page — one empty paragraph, which is the smallest document ProseMirror
 * will accept (a `doc` with no content at all is rejected by the schema, and the
 * editor would refuse the whole value rather than degrade).
 *
 * This is what the `Clear all` shortcut loads. It matters more than it looks:
 * against a prepared agreement a reader cannot tell their own typing from what
 * was already there, so the stored panel proves nothing. Empty, every node that
 * appears on the right is one they put there.
 */
export const EMPTY_DOCUMENT: EditorDocument = {
  schemaVersion: SCHEMA_VERSION,
  content: {
    type: 'doc',
    content: [paragraph()],
  },
};
