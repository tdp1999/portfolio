import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ToastService } from '@portfolio/console/shared/ui';
import { MediaService } from '@portfolio/console/shared/data-access';
import { BlogService } from '../blog.service';
import PostForm from './post.form';

// A non-empty editor document so the rich-text `content` control passes its
// required validator (these specs assert form validity around the cover image).
const DOC = {
  schemaVersion: 1,
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }] },
};

describe('PostFormPageComponent — cover-image-required (PST-011)', () => {
  let fixture: ComponentFixture<PostForm>;
  let component: PostForm;

  beforeEach(async () => {
    const blogService = {
      listAllCategories: jest.fn().mockReturnValue(of({ data: [] })),
      listAllTags: jest.fn().mockReturnValue(of({ data: [] })),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const mediaService = {
      list: jest.fn(),
      upload: jest.fn(),
      getById: jest.fn(),
      getByIdSilent: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PostForm],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: BlogService, useValue: blogService },
        { provide: MediaService, useValue: mediaService },
        { provide: ToastService, useValue: { success: jest.fn(), error: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    })
      // Stub the template so the rich-text editor (which injects RTE_EDITOR and
      // mounts the engine in afterNextRender) is not rendered — these specs cover
      // form logic, not the editor.
      .overrideComponent(PostForm, { set: { template: '<div>test</div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(PostForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects empty form: featuredImageId required when no cover picked', () => {
    component.form.patchValue({
      title: 'My Post',
      content: DOC,
      language: 'EN',
      status: 'DRAFT',
    });

    expect(component.form.controls.featuredImageId.value).toBe('');
    expect(component.form.controls.featuredImageId.hasError('required')).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('accepts the form when a cover id is set', () => {
    component.form.patchValue({
      title: 'My Post',
      content: DOC,
      language: 'EN',
      status: 'DRAFT',
      featuredImageId: 'media-123',
    });

    expect(component.form.controls.featuredImageId.hasError('required')).toBe(false);
    expect(component.form.controls.featuredImageId.value).toBe('media-123');
    expect(component.form.valid).toBe(true);
  });

  it('clearFeaturedImage() removes the cover and fires the required error again', () => {
    component.form.patchValue({
      title: 'My Post',
      content: DOC,
      language: 'EN',
      status: 'DRAFT',
      featuredImageId: 'media-123',
    });
    expect(component.form.controls.featuredImageId.valid).toBe(true);

    component.clearFeaturedImage();

    expect(component.form.controls.featuredImageId.value).toBe('');
    expect(component.form.controls.featuredImageId.touched).toBe(true);
    expect(component.form.controls.featuredImageId.hasError('required')).toBe(true);
  });
});
