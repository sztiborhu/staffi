import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AdminEmployeesComponent } from './employees.component';

describe('AdminEmployeesComponent', () => {
  let component: AdminEmployeesComponent;
  let fixture: ComponentFixture<AdminEmployeesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminEmployeesComponent,
        HttpClientTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEmployeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
