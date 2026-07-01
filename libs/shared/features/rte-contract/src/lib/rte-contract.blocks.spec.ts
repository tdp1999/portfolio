import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BLOCK_RENDERERS, BlockRenderer, provideBlockRenderers } from './rte-contract.blocks';

@Component({ selector: 'rte-test-a', template: '' })
class BlockA {}

@Component({ selector: 'rte-test-b', template: '' })
class BlockB {}

describe('provideBlockRenderers + BLOCK_RENDERERS', () => {
  it('registers each renderer under the multi token in order', () => {
    const a: BlockRenderer = { type: 'image-ref', component: BlockA };
    const b: BlockRenderer = { type: 'gallery', component: BlockB };

    TestBed.configureTestingModule({ providers: [provideBlockRenderers(a, b)] });

    const renderers = TestBed.inject(BLOCK_RENDERERS);
    expect(renderers.map((r) => r.type)).toEqual(['image-ref', 'gallery']);
    expect(renderers).toEqual([a, b]);
  });

  it('accumulates renderers across multiple provideBlockRenderers calls', () => {
    TestBed.configureTestingModule({
      providers: [
        provideBlockRenderers({ type: 'image-ref', component: BlockA }),
        provideBlockRenderers({ type: 'gallery', component: BlockB }),
      ],
    });

    expect(TestBed.inject(BLOCK_RENDERERS).map((r) => r.type)).toEqual(['image-ref', 'gallery']);
  });

  it('passes node + ctx through the inputs mapper', () => {
    const renderer: BlockRenderer<{ id: string }> = {
      type: 'image-ref',
      component: BlockA,
      inputs: (node, ctx) => ({ id: `${node.attrs?.['imageId']}@${ctx.locale}` }),
    };

    const inputs = renderer.inputs?.(
      { type: 'image-ref', attrs: { imageId: 'm1' } },
      {
        media: () => undefined,
        locale: 'en',
      }
    );
    expect(inputs).toEqual({ id: 'm1@en' });
  });
});
