import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistSelectorDialogComponent } from './playlist-selector-dialog.component';

describe('PlaylistSelectorDialogComponent', () => {
  let component: PlaylistSelectorDialogComponent;
  let fixture: ComponentFixture<PlaylistSelectorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistSelectorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaylistSelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
