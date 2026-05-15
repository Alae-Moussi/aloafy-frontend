import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandedPlayerComponent } from './expanded-player.component';

describe('ExpandedPlayerComponent', () => {
  let component: ExpandedPlayerComponent;
  let fixture: ComponentFixture<ExpandedPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandedPlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandedPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
