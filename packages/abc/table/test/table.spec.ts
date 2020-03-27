import { CommonModule } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Component, DebugElement, Type, ViewChild } from '@angular/core';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { dispatchDropDown } from '@delon/testing';
import { ALAIN_I18N_TOKEN, DatePipe, DelonLocaleModule, DelonLocaleService, DrawerHelper, en_US, ModalHelper } from '@delon/theme';
import { deepCopy, deepGet } from '@delon/util';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationComponent } from 'ng-zorro-antd/pagination';
import { Observable, of, Subject } from 'rxjs';
import { AlainI18NService, AlainI18NServiceFake } from '../../../theme/src/services/i18n/i18n';
import { STDataSource } from '../table-data-source';
import { STExport } from '../table-export';
import { STComponent } from '../table.component';
import { STConfig } from '../table.config';
import {
  STChange,
  STChangeType,
  STColumn,
  STColumnBadge,
  STColumnFilter,
  STColumnTag,
  STColumnTitle,
  STMultiSort,
  STPage,
  STReq,
  STRes,
  STResReNameType,
  STWidthMode,
} from '../table.interfaces';
import { STModule } from '../table.module';

const MOCKDATE = new Date();
const MOCKIMG = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==`;
const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

function genData(count: number) {
  return Array(count)
    .fill({})
    .map((_item: any, idx: number) => {
      return {
        id: idx + 1,
        name: `name ${idx + 1}`,
        age: Math.ceil(Math.random() * 10) + 20,
        yn: idx % 2 === 0,
        date: MOCKDATE,
        img: MOCKIMG,
        num: 11111111111.4556,
        status: Math.floor(Math.random() * 5) + 1,
        tag: r(1, 5),
        prices: {
          fix: `fix${idx + 1}`,
          total: Math.ceil(Math.random() * 10) + 200,
        },
      };
    });
}

const PS = 3;
const DEFAULTCOUNT = PS + 1;
const USERS: any[] = genData(DEFAULTCOUNT);

const i18nResult = 'zh';
class MockI18NServiceFake extends AlainI18NServiceFake {
  fanyi(_key: string) {
    return i18nResult;
  }
}

describe('abc: table', () => {
  let fixture: ComponentFixture<TestComponent>;
  let context: TestComponent;
  let dl: DebugElement;
  let page: PageObject;
  let comp: STComponent;
  let i18nSrv: AlainI18NService;

  function genModule(other: { template?: string; i18n?: boolean; minColumn?: boolean; providers?: any[]; createComp?: boolean }) {
    other = {
      template: '',
      i18n: false,
      minColumn: false,
      providers: [],
      createComp: true,
      ...other,
    };
    const imports = [
      NoopAnimationsModule,
      CommonModule,
      FormsModule,
      HttpClientTestingModule,
      RouterTestingModule.withRoutes([]),
      NzModalModule,
      NzDrawerModule,
      STModule,
      DelonLocaleModule,
    ];
    const providers = [
      {
        provide: ALAIN_I18N_TOKEN,
        useClass: MockI18NServiceFake,
      },
    ];
    if (other.providers!.length > 0) {
      providers.push(...other.providers!);
    }
    TestBed.configureTestingModule({
      imports,
      declarations: [TestComponent, TestExpandComponent],
      providers,
    });
    if (other.template) TestBed.overrideTemplate(TestComponent, other.template);
    // ALAIN_I18N_TOKEN 默认为 root 会导致永远都会存在
    i18nSrv = TestBed.inject(ALAIN_I18N_TOKEN);
    if (other.createComp) {
      createComp(other.minColumn, TestComponent);
    }
  }

  function createComp<T extends TestComponent>(minColumn = false, type: Type<T>) {
    fixture = TestBed.createComponent(type);
    dl = fixture.debugElement;
    context = dl.componentInstance;
    context.data = deepCopy(USERS);
    if (minColumn) {
      context.columns = [{ title: '', index: 'id' }];
    }
    page = new PageObject();
  }

  afterEach(() => comp.ngOnDestroy());

  describe('', () => {
    beforeEach(() => {
      genModule({ createComp: false });
      createComp(true, TestComponent);
    });
    describe('#columns', () => {
      describe('[title]', () => {
        xit('with STColumnTitle type', done => {
          page.newColumn([{ title: { text: 'a' }, index: 'id' }]).then(() => {
            page.expectHead('a', 'id', '.ant-table-column-title');
            done();
          });
        });
        xit('should be render optional', done => {
          page.newColumn([{ title: { text: 'a', optional: 'b', optionalHelp: 'help' }, index: 'id' }]).then(() => {
            page.expectHead('b', 'id', '.st__head-optional');
            expect(page.getHead('id').querySelector('.st__head-tip') != null).toBe(true);
            done();
          });
        });
      });
      describe('[type]', () => {
        describe(`with checkbox`, () => {
          xit(`should be render checkbox`, done => {
            page.newColumn([{ title: '', index: 'id', type: 'checkbox' }]).then(() => {
              page
                .expectElCount('.st__checkall', 1, 'muse be a check all')
                .expectElCount('.st__body .ant-checkbox-wrapper', PS, `muse be ${PS} check in body`);
              done();
            });
          });
          xit('should auto column width', done => {
            page.newColumn([{ title: 'id', index: 'id', type: 'checkbox' }]).then(() => {
              page.expectColumn('id', 'width', '50px');
              done();
            });
          });
          xit('should be check all current page', done => {
            page.newColumn([{ title: '', index: 'id', type: 'checkbox' }]).then(() => {
              page.click('.st__checkall');
              expect(comp._data.filter(w => w.checked).length).toBe(PS);
              page.click('.st__checkall');
              expect(comp._data.filter(w => w.checked).length).toBe(0);
              done();
            });
          });
          xit('should be checked in row', done => {
            page.newColumn([{ title: '', index: 'id', type: 'checkbox' }]).then(() => {
              page
                .expectData(1, 'checked', undefined)
                .click('.st__body .ant-checkbox-wrapper')
                .expectData(1, 'checked', true)
                .click('.st__body .ant-checkbox-wrapper')
                .expectData(1, 'checked', false);
              done();
            });
          });
          xit('should selected id value less than 2 rows', done => {
            const selections = [
              {
                text: '<div class="j-s1"></div>',
                select: (ls: any[]) => ls.forEach(i => (i.checked = i.id < 2)),
              },
            ];
            page.newColumn([{ title: '', index: 'id', type: 'checkbox', selections }]).then(() => {
              page.expectData(1, 'checked', undefined).expectData(2, 'checked', undefined);
              // mock click
              comp._rowSelection(comp._columns[0].selections![0]);
              page.expectData(1, 'checked', true).expectData(2, 'checked', false);
              done();
            });
          });
          xit('should be unchecked via clearCheck', done => {
            page.newColumn([{ title: '', index: 'id', type: 'checkbox' }]).then(() => {
              page.expectData(1, 'checked', undefined).click('.st__body .ant-checkbox-wrapper').expectData(1, 'checked', true);
              comp.clearCheck();
              page.expectData(1, 'checked', false);
              done();
            });
          });
        });
        describe('with radio', () => {
          xit(`should be render checkbox`, done => {
            page.newColumn([{ title: 'RADIOname', index: 'id', type: 'radio' }]).then(() => {
              page.expectHead('RADIOname', 'id').expectElCount('.st__body .ant-radio-wrapper', PS, `muse be ${PS} radio in body`);
              done();
            });
          });
          xit('should auto column width', done => {
            page.newColumn([{ title: 'id', index: 'id', type: 'radio' }]).then(() => {
              page.expectColumn('id', 'width', '50px');
              done();
            });
          });
          xit('should be checked in row', done => {
            page.newColumn([{ title: '', index: 'id', type: 'radio' }]).then(() => {
              page
                .expectData(1, 'checked', undefined)
                .click('.st__body .ant-radio-wrapper')
                .expectData(1, 'checked', true)
                .click('.st__body tr[data-index="1"] .ant-radio-wrapper')
                .expectData(1, 'checked', false);
              done();
            });
          });
          xit('should be unchecked via clearRadio', done => {
            page.newColumn([{ title: '', index: 'id', type: 'radio' }]).then(() => {
              page.expectData(1, 'checked', undefined).click('.st__body .ant-radio-wrapper').expectData(1, 'checked', true);
              comp.clearRadio();
              page.expectData(1, 'checked', false);
              done();
            });
          });
        });
        describe('with link', () => {
          xit(`should be render anchor link`, done => {
            const columns = [
              {
                title: '',
                index: 'id',
                type: 'link',
                click: jasmine.createSpy(),
              },
            ];
            page.newColumn(columns as any).then(() => {
              page.expectCell('1', 1, 1, 'a').clickCell('a');
              expect(columns[0].click).toHaveBeenCalled();
              done();
            });
          });
          xit(`should be text when not specify click`, done => {
            page.newColumn([{ title: '', index: 'id', type: 'link' }]).then(() => {
              page.expectCell(null, 1, 1, 'a');
              done();
            });
          });
          xit('should be navigate url when click is string value', done => {
            const router = TestBed.inject<Router>(Router);
            spyOn(router, 'navigateByUrl');
            context.data = [{ link: '/a' }];
            page
              .newColumn([
                {
                  title: '',
                  index: 'link',
                  type: 'link',
                  click: (item: any) => item.link,
                },
              ])
              .then(() => {
                page.clickCell('a', 1, 1);
                expect(router.navigateByUrl).toHaveBeenCalled();
                done();
              });
          });
        });
        describe('with img', () => {
          xit(`should be render img`, done => {
            const columns = [{ title: '', index: 'img', type: 'img' }];
            page.newColumn(columns as any).then(() => {
              page.expectCell('', 1, 1, 'img');
              done();
            });
          });
          xit('should not render img when is empty data', done => {
            const columns = [{ title: '', index: 'img', type: 'img' }];
            context.data = [{ img: MOCKIMG }, { img: '' }];
            page.newColumn(columns as any).then(() => {
              page.expectCell('', 1, 1, 'img').expectCell(null, 2, 1, 'img');
              done();
            });
          });
        });
        describe('with currency', () => {
          xit(`should be render currency`, done => {
            page.newColumn([{ title: '', index: 'id', type: 'currency' }]).then(() => {
              page.expectCell('￥1.00');
              done();
            });
          });
          xit(`should be text right`, done => {
            page.newColumn([{ title: '', index: 'id', type: 'currency' }]).then(() => {
              expect(page.getCell().classList).toContain('text-right');
              done();
            });
          });
        });
        describe('with number', () => {
          xit(`should be render number`, done => {
            page.newColumn([{ title: '', index: 'num', type: 'number' }]).then(() => {
              page.expectCell('11,111,111,111.456');
              done();
            });
          });
          xit(`should be custom render number digits`, done => {
            page
              .newColumn([
                {
                  title: '',
                  index: 'id',
                  type: 'number',
                  numberDigits: '3.1-5',
                },
              ])
              .then(() => {
                page.expectCell('001.0');
                done();
              });
          });
          xit(`should be text right`, done => {
            page.newColumn([{ title: '', index: 'num', type: 'number' }]).then(() => {
              expect(page.getCell().classList).toContain('text-right');
              done();
            });
          });
        });
        describe('with date', () => {
          xit(`should be render date`, done => {
            page.newColumn([{ title: '', index: 'date', type: 'date' }]).then(() => {
              page.expectCell(new DatePipe().transform(MOCKDATE, 'yyyy-MM-dd HH:mm'));
              done();
            });
          });
          xit(`should be custom render date format`, done => {
            page
              .newColumn([
                {
                  title: '',
                  index: 'date',
                  type: 'date',
                  dateFormat: 'yyyy-MM',
                },
              ])
              .then(() => {
                page.expectCell(new DatePipe().transform(MOCKDATE, 'yyyy-MM'));
                done();
              });
          });
          xit(`should be text center`, done => {
            page.newColumn([{ title: '', index: 'date', type: 'date' }]).then(() => {
              expect(page.getCell().classList).toContain('text-center');
              done();
            });
          });
        });
        describe('with yn', () => {
          xit(`should be render yn`, done => {
            page.newColumn([{ title: '', index: 'yn', type: 'yn' }]).then(() => {
              page.expectCell('是', 1, 1, '', true).expectCell('否', 2, 1, '', true);
              done();
            });
          });
          xit(`should be custom render yn`, done => {
            page.newColumn([{ title: '', index: 'yn', type: 'yn', yn: { yes: 'Y', no: 'N' } }]).then(() => {
              page.expectCell('Y', 1, 1, '', true).expectCell('N', 2, 1, '', true);
              done();
            });
          });
          xit(`should be custom truth value`, done => {
            page
              .newColumn([
                {
                  title: '',
                  index: 'id',
                  type: 'yn',
                  yn: {
                    truth: 1,
                    yes: 'Y',
                    no: 'N',
                  },
                },
              ])
              .then(() => {
                page.expectCell('Y', 1, 1, '', true).expectCell('N', 2, 1, '', true).expectCell('N', 3, 1, '', true);
                done();
              });
          });
        });
      });
      describe('with badge', () => {
        const BADGE: STColumnBadge = {
          1: { text: '成功', color: 'success' },
          2: { text: '错误', color: 'error' },
          3: { text: '进行中', color: 'processing' },
          4: { text: '默认', color: 'default' },
          5: { text: '警告', color: 'warning' },
        };
        xit(`should be render badge`, done => {
          page.newColumn([{ title: '', index: 'status', type: 'badge', badge: BADGE }]).then(() => {
            page.expectElCount('.ant-badge', PS);
            done();
          });
        });
        xit(`should be render text when badge is undefined or null`, done => {
          page.newColumn([{ title: '', index: 'status', type: 'badge', badge: null }]).then(() => {
            page.expectElCount('.ant-badge', 0);
            done();
          });
        });
      });
      describe('with tag', () => {
        const TAG: STColumnTag = {
          1: { text: '成功', color: 'green' },
          2: { text: '错误', color: 'red' },
          3: { text: '进行中', color: 'blue' },
          4: { text: '默认', color: '' },
          5: { text: '警告', color: 'orange' },
        };
        xit(`should be render tag`, done => {
          page.newColumn([{ title: 'tag', index: 'tag', type: 'tag', tag: TAG }]).then(() => {
            page.expectElCount('.ant-tag', PS);
            done();
          });
        });
        xit(`should be render text when tag is undefined or null`, done => {
          page.newColumn([{ title: '', index: 'status', type: 'tag', tag: null }]).then(() => {
            page.expectElCount('.ant-tag', 0);
            done();
          });
        });
      });
      describe('[other]', () => {
        xit('should custom render via format', done => {
          page
            .newColumn([
              {
                title: '',
                index: 'id',
                format: a => `<div class="j-format">${a.id}</div>`,
              },
            ])
            .then(() => {
              page.expectCell('1', 1, 1, '.j-format');
              done();
            });
        });
        xit('should default render via default', done => {
          page
            .newColumn([
              {
                title: '',
                index: 'id1',
                default: '-',
              },
            ])
            .then(() => {
              page.expectCell('-');
              done();
            });
        });
        xit('should be custom class in cell', done => {
          page.newColumn([{ title: '', index: 'id', className: 'asdf' }]).then(() => {
            expect(page.getCell().classList).toContain('asdf');
            done();
          });
        });
      });
      describe('[buttons]', () => {
        xit(`should be pop confirm when type=del`, done => {
          const columns: STColumn[] = [
            {
              title: '',
              buttons: [
                { text: 'del', type: 'del' },
                {
                  type: 'del',
                  click: jasmine.createSpy(),
                  popTitle: 'confirm?',
                },
              ],
            },
          ];
          page.newColumn(columns).then(() => {
            page.expectCell('del', 1, 1, '[nz-popconfirm]');
            // mock trigger
            comp._btnClick(comp._data[0], comp._columns[0].buttons![0]);
            expect(columns[0].buttons![1].click).not.toHaveBeenCalled();
            comp._btnClick(comp._data[0], comp._columns[0].buttons![1]);
            expect(columns[0].buttons![1].click).toHaveBeenCalled();
            done();
          });
        });
        xit('should custom render text via format', done => {
          const columns: STColumn[] = [
            {
              title: '',
              buttons: [
                {
                  text: a => `<div class="j-btn-format">${a.id}</div>`,
                },
              ],
            },
          ];
          page.newColumn(columns).then(() => {
            page.expectElCount('.j-btn-format', PS);
            done();
          });
        });
        xit('should custom render text via text function', done => {
          const columns: STColumn[] = [
            {
              title: '',
              buttons: [
                {
                  text: a => `<div class="j-btn-format">${a.id}</div>`,
                },
              ],
            },
          ];
          page.newColumn(columns).then(() => {
            page.expectElCount('.j-btn-format', PS);
            done();
          });
        });
        xit('#614', done => {
          const columns: STColumn[] = [
            {
              title: '',
              buttons: [
                { text: 'del', type: 'del' },
                {
                  text: 'del',
                  type: 'del',
                  click: jasmine.createSpy(),
                  popTitle: 'confirm?',
                },
              ],
            },
          ];
          page.newColumn(columns).then(() => {
            // mock trigger
            comp._btnClick(comp._data[0], comp._columns[0].buttons![0]);
            expect(true).toBe(true);
            done();
          });
        });
        describe('[condition]', () => {
          xit('should be hide menu in first row', done => {
            const columns: STColumn[] = [
              {
                title: '',
                buttons: [{ text: 'a', iif: (item: any) => item.id !== 1 }],
              },
            ];
            page.newColumn(columns).then(() => {
              page.expectCell(null!, 1, 1, 'a').expectCell('a', 2, 1, 'a');
              done();
            });
          });
        });
        describe('[events]', () => {
          xit('#reload', done => {
            const columns: STColumn[] = [
              {
                title: '',
                buttons: [{ text: 'a', click: 'reload' }],
              },
            ];
            spyOn(comp, 'reload');
            page.newColumn(columns).then(() => {
              expect(comp.reload).not.toHaveBeenCalled();
              page.clickCell('a');
              expect(comp.reload).toHaveBeenCalled();
              done();
            });
          });
          xit('#load', done => {
            const columns: STColumn[] = [
              {
                title: '',
                buttons: [{ text: 'a', click: 'load' }],
              },
            ];
            spyOn(comp, 'load');
            page.newColumn(columns).then(() => {
              expect(comp.load).not.toHaveBeenCalled();
              page.clickCell('a');
              expect(comp.load).toHaveBeenCalled();
              done();
            });
          });
          describe('#modal', () => {
            xit('is normal mode', done => {
              const columns: STColumn[] = [
                {
                  title: '',
                  buttons: [
                    {
                      text: 'a',
                      type: 'modal',
                      click: jasmine.createSpy(),
                      modal: {
                        component: {},
                        params: () => ({ aa: 1 }),
                      },
                    },
                  ],
                },
              ];
              const modalHelp = TestBed.inject<ModalHelper>(ModalHelper);
              const mock$ = new Subject();
              spyOn(modalHelp, 'create').and.callFake(() => mock$);
              page.newColumn(columns).then(() => {
                expect(modalHelp.create).not.toHaveBeenCalled();
                page.clickCell('a');
                expect(modalHelp.create).toHaveBeenCalled();
                expect(columns[0].buttons![0].click).not.toHaveBeenCalled();
                mock$.next({});
                expect(columns[0].buttons![0].click).toHaveBeenCalled();
                mock$.unsubscribe();
                done();
              });
            });
            xit('is static mode', done => {
              const columns: STColumn[] = [
                {
                  title: '',
                  buttons: [
                    {
                      text: 'a',
                      type: 'static',
                      click: jasmine.createSpy(),
                      modal: {
                        component: {},
                        params: () => ({ aa: 1 }),
                      },
                    },
                  ],
                },
              ];
              const modalHelp = TestBed.inject<ModalHelper>(ModalHelper);
              const mock$ = new Subject();
              spyOn(modalHelp, 'createStatic').and.callFake(() => mock$);
              page.newColumn(columns).then(() => {
                expect(modalHelp.createStatic).not.toHaveBeenCalled();
                page.clickCell('a');
                expect(modalHelp.createStatic).toHaveBeenCalled();
                expect(columns[0].buttons![0].click).not.toHaveBeenCalled();
                mock$.next({});
                expect(columns[0].buttons![0].click).toHaveBeenCalled();
                mock$.unsubscribe();
                done();
              });
            });
          });
          describe('#drawer', () => {
            xit('is normal mode', done => {
              const columns: STColumn[] = [
                {
                  title: '',
                  buttons: [
                    {
                      text: 'a',
                      type: 'drawer',
                      click: jasmine.createSpy(),
                      drawer: {
                        component: {},
                        params: () => ({ aa: 1 }),
                      },
                    },
                  ],
                },
              ];
              const drawerHelp = TestBed.inject<DrawerHelper>(DrawerHelper);
              const mock$ = new Subject();
              spyOn(drawerHelp, 'create').and.callFake(() => mock$);
              page.newColumn(columns).then(() => {
                expect(drawerHelp.create).not.toHaveBeenCalled();
                page.clickCell('a');
                expect(drawerHelp.create).toHaveBeenCalled();
                expect(columns[0].buttons![0].click).not.toHaveBeenCalled();
                mock$.next({});
                expect(columns[0].buttons![0].click).toHaveBeenCalled();
                mock$.unsubscribe();
                done();
              });
            });
          });
          describe('#link', () => {
            xit('should be trigger click', done => {
              const columns: STColumn[] = [
                {
                  title: '',
                  buttons: [{ text: 'a', type: 'link', click: () => null }],
                },
              ];
              const router = TestBed.inject<Router>(Router);
              spyOn(router, 'navigateByUrl');
              page.newColumn(columns).then(() => {
                expect(router.navigateByUrl).not.toHaveBeenCalled();
                page.clickCell('a');
                expect(router.navigateByUrl).not.toHaveBeenCalled();
                done();
              });
            });
            xit('should be navigate when return a string value', done => {
              const columns: STColumn[] = [
                {
                  title: '',
                  buttons: [{ text: 'a', type: 'link', click: () => '/a' }],
                },
              ];
              const router = TestBed.inject<Router>(Router);
              spyOn(router, 'navigateByUrl');
              page.newColumn(columns).then(() => {
                expect(router.navigateByUrl).not.toHaveBeenCalled();
                page.clickCell('a');
                expect(router.navigateByUrl).toHaveBeenCalled();
                done();
              });
            });
            xit('should be include route state when return a string value', done => {
              const columns: STColumn[] = [
                {
                  title: '',
                  buttons: [{ text: 'a', type: 'link', click: () => '/a' }],
                },
              ];
              const router = TestBed.inject<Router>(Router);
              const spy = spyOn(router, 'navigateByUrl');
              page.newColumn(columns).then(() => {
                page.clickCell('a');
                const arg = spy.calls.mostRecent().args[1] as any;
                expect(arg.state.pi).toBe(1);
                done();
              });
            });
          });
        });
      });
      describe('[fixed]', () => {
        xit('should be fixed left column', done => {
          page
            .newColumn([
              { title: '1', index: 'id', fixed: 'left', width: '100px' },
              { title: '2', index: 'id', fixed: 'left', width: '100px' },
              { title: '3', index: 'id', fixed: 'left', width: '100px' },
            ])
            .then(() => {
              expect(page.getCell(1, 1).style.left).toBe('0px');
              expect(page.getCell(1, 2).style.left).toBe('100px');
              expect(page.getCell(1, 3).style.left).toBe('200px');
              done();
            });
        });
        xit('should be fixed right column', done => {
          page
            .newColumn([
              { title: '1', index: 'id', fixed: 'right', width: '100px' },
              { title: '2', index: 'id', fixed: 'right', width: '100px' },
              { title: '3', index: 'id', fixed: 'right', width: '100px' },
            ])
            .then(() => {
              expect(page.getCell(1, 1).style.right).toBe('200px');
              expect(page.getCell(1, 2).style.right).toBe('100px');
              expect(page.getCell(1, 3).style.right).toBe('0px');
              done();
            });
        });
      });
    });
    describe('[data source]', () => {
      let httpBed: HttpTestingController;
      beforeEach(() => {
        httpBed = TestBed.inject(HttpTestingController as Type<HttpTestingController>);
      });
      xit('support null data', done => {
        context.data = null;
        fixture.detectChanges();
        fixture
          .whenStable()
          .then(() => {
            expect(comp._data.length).toBe(0);
            context.data = genData(10);
            fixture.detectChanges();
            return fixture.whenStable();
          })
          .then(() => {
            expect(comp._data.length).toBe(PS);
            done();
          });
      });
      xit('should only restore data', () => {
        // tslint:disable-next-line:no-string-literal
        const dataSource: STDataSource = comp['dataSource'];
        spyOn(dataSource, 'process').and.callFake(() => of({} as any));
        fixture.detectChanges();
        expect(comp.ps).toBe(PS);
      });
      xit('should be automatically cancel paging when the returned body value is an array type', done => {
        context.pi = 1;
        context.ps = 2;
        context.data = '/mock';
        fixture.detectChanges();
        httpBed.expectOne(() => true).flush([{}, {}, {}]);
        fixture.whenStable().then(() => {
          expect(comp.pi).toBe(1);
          expect(comp.ps).toBe(3);
          expect(comp._isPagination).toBe(false);
          done();
        });
      });
      describe('Http Request', () => {
        xit('when error request', done => {
          context.data = '/mock';
          fixture.detectChanges();
          httpBed.expectOne(() => true).error(new ErrorEvent('cancel'));
          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(0);
            done();
          });
        });
        xit('when http status: 0', done => {
          context.data = '/mock';
          fixture.detectChanges();
          httpBed.expectOne(() => true).flush(null, { status: 0, statusText: '' });
          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(0);
            done();
          });
        });
        xit('when http status: 404', done => {
          context.data = '/mock';
          fixture.detectChanges();
          httpBed.expectOne(() => true).flush(null, { status: 404, statusText: 'Not found' });
          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(0);
            done();
          });
        });
        xit('when http status: 403', done => {
          context.data = '/mock';
          fixture.detectChanges();
          httpBed.expectOne(() => true).flush(null, { status: 403, statusText: 'Forbidden' });
          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(0);
            done();
          });
        });
        xit('should be ingore catch error when component is destroyed', done => {
          expect(context.error).not.toHaveBeenCalled();
          context.data = '/mock';
          fixture.detectChanges();
          comp.ngOnDestroy();
          fixture.whenStable().then(() => {
            expect(context.error).not.toHaveBeenCalled();
            done();
          });
        });
        xit('should be ingored incomplete request when has new request', done => {
          context.data = '/mock1';
          fixture.detectChanges();
          context.data = '/mock2';
          fixture.detectChanges();
          // Can't call have beed unsubscribe request in flush method, so muse be using `try {} catch {}`
          try {
            httpBed.expectOne(req => req.url === '/mock2').flush([{}]);
            httpBed.expectOne(req => req.url === '/mock1').flush([{}, {}]);
            expect(true).toBe(false);
          } catch {}

          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(1);
            done();
          });
        });
      });
    });
    describe('#req', () => {
      xit('should fix all paraments when only part parament', () => {
        context.req = { reName: { pi: 'PI' } };
        fixture.detectChanges();
        expect(comp.req.reName).not.toBeNull();
        expect(comp.req.reName!.pi).toBe('PI');
        expect(comp.req.reName!.ps).toBe('ps');
      });
      xit('should be ingore request when lazyLoad is true', () => {
        const anyComp = comp as any;
        spyOn(anyComp, 'loadPageData');
        context.req = { lazyLoad: true };
        fixture.detectChanges();
        expect(anyComp.loadPageData).not.toHaveBeenCalled();
      });
    });
    describe('#res', () => {
      xit('should fix all paraments when only part parament', () => {
        context.res = { reName: { total: 'a.b' } };
        fixture.detectChanges();
        const reName = comp.res.reName as STResReNameType;
        expect(reName).not.toBeNull();
        expect(reName.total![0]).toBe('a');
        expect(reName.total![1]).toBe('b');
        expect(reName.list!.length).toBe(1);
        expect(reName.list![0]).toBe('list');
      });
      xit('support a.b', () => {
        context.res = { reName: { total: 'a.b', list: 'c.d' } };
        fixture.detectChanges();
        const reName = comp.res.reName as STResReNameType;
        expect(reName).not.toBeNull();
        expect(Array.isArray(reName.total)).toBe(true);
        expect(Array.isArray(reName.list)).toBe(true);
        expect(reName.total![0]).toBe('a');
        expect(reName.total![1]).toBe('b');
        expect(reName.list![0]).toBe('c');
        expect(reName.list![1]).toBe('d');
      });
    });
    describe('#page', () => {
      xit('should fix all paraments when only part parament', () => {
        context.page = { total: `TO:{{total}}` };
        fixture.detectChanges();
        expect(comp.page.placement).toBe(`right`);
        expect(comp.page.total).toBe(`TO:{{total}}`);
      });
      xit('should be ingore pi event trigger when change size in last page', done => {
        context.page = { showSize: true, pageSizes: [10, 20] };
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.go(2);
          let load = 0;
          spyOn(context.comp as any, 'loadData').and.callFake(() => {
            ++load;
            return Promise.resolve({});
          });
          const pc = dl.query(By.directive(NzPaginationComponent)).injector.get<NzPaginationComponent>(NzPaginationComponent);
          expect(load).toBe(0);
          pc.onPageSizeChange(10);
          fixture.detectChanges();
          expect(load).toBe(1);
          setTimeout(done);
        });
      });
    });
    describe('#showTotal', () => {
      xit('with true', done => {
        context.page.total = true;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElContent('.ant-pagination-total-text', `共 ${DEFAULTCOUNT} 条`);
          done();
        });
      });
      xit('with false', done => {
        context.page.total = false;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElContent('.ant-pagination-total-text', '');
          done();
        });
      });
      xit('should be custom template', done => {
        context.pi = 1;
        context.ps = 3;
        context.page.total = `{{total}}/{{range[0]}}/{{range[1]}}`;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElContent('.ant-pagination-total-text', `${DEFAULTCOUNT}/${comp.pi}/${comp.ps}`);
          done();
        });
      });
    });
    describe('#showPagination', () => {
      describe('with undefined', () => {
        beforeEach(() => {
          context.ps = 2;
          context.page.show = undefined;
        });
        xit('should auto hide when total less than ps', done => {
          context.data = deepCopy(USERS).slice(0, 1);
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectElCount('nz-pagination', 0);
            done();
          });
        });
        xit('should auto show when ps less than total', done => {
          context.data = deepCopy(USERS).slice(0, 3);
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectElCount('nz-pagination', 1);
            done();
          });
        });
      });
      xit('should always show when with true', done => {
        context.page.show = true;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElCount('nz-pagination', 1);
          done();
        });
      });
    });
    describe('#pagePlacement', () => {
      ['left', 'center', 'right'].forEach(pos => {
        xit(`with ${pos}`, done => {
          context.page.placement = pos as any;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectElCount(`.st__p-${pos}`, 1);
            done();
          });
        });
      });
    });
    describe('#responsive', () => {
      xit('with true', done => {
        context.responsive = true;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElCount(`.ant-table-rep`, 1);
          done();
        });
      });
      xit('with false', done => {
        context.responsive = false;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElCount(`.ant-table-rep`, 0);
          page.expectElCount(`.ant-table-rep__title`, 0);
          done();
        });
      });
    });
    describe('#responsiveHideHeaderFooter', () => {
      xit('should working', done => {
        context.responsiveHideHeaderFooter = true;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElCount(`.ant-table-rep__hide-header-footer`, 1);
          done();
        });
      });
    });
    describe('#toTop', () => {
      beforeEach(() => {
        context.page.toTopOffset = 10;
      });
      xit('with true', done => {
        context.page.toTop = true;
        fixture.detectChanges();
        const el = page.getEl('st');
        spyOn(el, 'scrollIntoView');
        fixture
          .whenStable()
          .then(() => page.go(2))
          .then(() => {
            expect(el.scrollIntoView).toHaveBeenCalled();
            done();
          });
      });
      xit('with false', done => {
        context.page.toTop = false;
        fixture.detectChanges();
        const el = page.getEl('st');
        spyOn(el, 'scrollIntoView');
        fixture
          .whenStable()
          .then(() => page.go(2))
          .then(() => {
            expect(el.scrollIntoView).not.toHaveBeenCalled();
            done();
          });
      });
      xit('should scroll to .ant-table-body when used scroll', done => {
        context.scroll = { x: '1300px' };
        context.page.toTop = true;
        fixture.detectChanges();
        const el = page.getEl('st');
        spyOn(el, 'scrollIntoView');
        fixture
          .whenStable()
          .then(() => page.go(2))
          .then(() => {
            page.go(2);
            expect(el.scrollIntoView).not.toHaveBeenCalled();
            done();
          });
      });
    });
    describe('#expand', () => {
      beforeEach(() => createComp(true, TestExpandComponent));
      xit('should be switch expand via expand icon', done => {
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          const el = page.getCell(1, 1).querySelector('.ant-table-row-expand-icon') as HTMLElement;
          page.expectData(1, 'expand', undefined);
          el.click();
          page.expectData(1, 'expand', true).expectChangeType('expand');
          done();
        });
      });
      describe('should be expanded when click row if expandRowByClick', () => {
        xit('with true', done => {
          context.expandRowByClick = true;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            const el = page.getCell(1, 2);
            page.expectData(1, 'expand', undefined);
            el.click();
            page.expectData(1, 'expand', true).expectChangeType('expand');
            done();
          });
        });
        xit('with false', done => {
          context.expandRowByClick = false;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            const el = page.getCell(1, 2);
            page.expectData(1, 'expand', undefined);
            el.click();
            page.expectData(1, 'expand', undefined);
            done();
          });
        });
      });
      describe('expandRowByClick', () => {
        xit('should be close other expaned', done => {
          context.expandAccordion = true;
          context.expandRowByClick = true;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.getCell(1, 2).click();
            page.getCell(2, 2).click();
            page.expectData(1, 'expand', false);
            page.expectData(2, 'expand', true);
            done();
          });
        });
        xit('should be keeping expaned', done => {
          context.expandAccordion = false;
          context.expandRowByClick = true;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.getCell(1, 2).click();
            page.getCell(2, 2).click();
            page.expectData(1, 'expand', true);
            page.expectData(2, 'expand', true);
            done();
          });
        });
        xit('should be stop propagation in button event', done => {
          context.expandRowByClick = true;
          context.columns = [
            {
              title: '',
              buttons: [
                {
                  text: 'btn',
                },
              ],
            },
          ];
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.getEl('.st__btn-text').click();
            page.expectData(1, 'expand', undefined);
            done();
          });
        });
      });
      describe('should be set showExpand in row data', () => {
        xit(`muse be hide expand icon`, done => {
          context.expandRowByClick = false;
          context.data = deepCopy(USERS).slice(0, 1) as NzSafeAny[];
          context.data[0].showExpand = false;
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectElCount('.ant-table-row-expand-icon', 0);
            page.getCell(1, 2).click();
            page.expectChangeType('expand', false);
            done();
          });
        });
      });
    });
    describe('[filter]', () => {
      describe('in local-data', () => {
        let filter: STColumnFilter;
        let firstCol: STColumn;
        beforeEach(() => {
          context.columns = [
            {
              title: '',
              index: 'i',
              filter: {
                multiple: true,
                menus: [
                  { text: 'f1', value: 'fv1' },
                  { text: 'f2', value: 'fv2' },
                ],
                confirmText: 'ok',
                clearText: 'reset',
                icon: 'aa',
                fn: () => true,
              },
            },
          ];
        });
        xit('muse provide the fn function', done => {
          spyOn(console, 'warn');
          context.columns[0].filter!.fn = null;
          fixture.detectChanges();
          firstCol = comp._columns[0];
          filter = firstCol.filter as STColumnFilter;
          comp._filterRadio(firstCol, filter.menus![0], true);
          comp._filterRadio(firstCol, filter.menus![1], true);
          comp._filterConfirm(firstCol);
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            expect(console.warn).toHaveBeenCalled();
            done();
          });
        });
        describe('when is single', () => {
          beforeEach(() => {
            context.columns[0].filter!.multiple = false;
            fixture.detectChanges();
            firstCol = comp._columns[0];
            filter = firstCol.filter as STColumnFilter;
            comp._filterRadio(firstCol, filter.menus![0], true);
            comp._filterRadio(firstCol, filter.menus![1], true);
            comp._filterConfirm(firstCol);
          });
          xit('should be filter', () => {
            const res = filter.menus!.filter(w => w.checked);
            expect(res.length).toBe(1);
          });
          xit('should be clean', () => {
            comp.clearFilter();
            const res = filter.menus!.filter(w => w.checked);
            expect(res.length).toBe(0);
          });
        });
        describe('when is multiple', () => {
          beforeEach(() => {
            context.columns[0].filter!.multiple = true;
            fixture.detectChanges();
            firstCol = comp._columns[0];
            filter = firstCol.filter as STColumnFilter;
            filter.menus![0].checked = true;
            filter.menus![1].checked = true;
            comp._filterConfirm(firstCol);
          });
          xit('should be filter', () => {
            const res = filter.menus!.filter(w => w.checked);
            expect(res.length).toBe(2);
          });
          xit('should be clean', () => {
            comp._filterClear(firstCol);
            const res = filter.menus!.filter(w => w.checked);
            expect(res.length).toBe(0);
          });
        });
        describe('when type is keyword', () => {
          beforeEach(() => {
            context.columns[0].filter!.type = 'keyword';
            context.columns[0].filter!.default = true;
            context.columns[0].filter!.menus![0].value = 'a';
            fixture.detectChanges();
            firstCol = comp._columns[0];
            filter = firstCol.filter!;
          });
          xit('should be filter', () => {
            expect(context.change).not.toHaveBeenCalled();
            comp._filterConfirm(firstCol);
            expect(context.change).toHaveBeenCalled();
          });
          xit('should be clean', () => {
            const m = filter.menus![0];
            expect(m.value).toBe('a');
            context.comp.clearFilter();
            expect(m.value).toBe(undefined);
          });
        });
      });
    });
    describe('[sort]', () => {
      describe('in local-data', () => {
        beforeEach(() => {
          context.columns = [
            {
              title: '',
              index: 'i',
              sort: { default: 'ascend', compare: () => 1 },
            },
            {
              title: '',
              index: 'i',
              sort: { default: 'descend', compare: () => 1 },
            },
          ];
        });
        describe('when single-sort', () => {
          beforeEach(() => (context.multiSort = false));
          xit('muse provide the compare function', done => {
            spyOn(console, 'warn');
            context.columns = [{ title: '', index: 'i', sort: true }];
            fixture.detectChanges();
            comp.sort(comp._columns[0], 0, 'descend');
            fixture.detectChanges();
            fixture.whenStable().then(() => {
              expect(console.warn).toHaveBeenCalled();
              done();
            });
          });
          xit('should be sorting', () => {
            fixture.detectChanges();
            comp.sort(comp._columns[0], 0, 'descend');
            const sortList = comp._columns.filter(item => item._sort && item._sort.enabled && item._sort.default).map(item => item._sort!);
            expect(sortList.length).toBe(1);
            expect(sortList[0].default).toBe('descend');
          });
        });
        describe('when multi-sort', () => {
          beforeEach(() => (context.multiSort = true));
          xit('should be sorting', () => {
            fixture.detectChanges();
            comp.sort(comp._columns[0], 0, 'descend');
            comp.sort(comp._columns[1], 0, 'ascend');
            const sortList = comp._columns.filter(item => item._sort && item._sort.enabled && item._sort.default).map(item => item._sort!);
            expect(sortList.length).toBe(2);
            expect(sortList[0].default).toBe('descend');
            expect(sortList[1].default).toBe('ascend');
          });
        });
      });
    });
    describe('[row events]', () => {
      beforeEach(fakeAsync(() => {
        context.rowClickTime = 10;
        fixture.detectChanges();
        tick();
      }));
      xit(`should be row click`, fakeAsync(() => {
        (page.getCell() as HTMLElement).click();
        fixture.detectChanges();
        tick(100);
        expect(page._changeData.type).toBe('click');
      }));
      xit(`should be row double click`, fakeAsync(() => {
        const cell = page.getCell() as HTMLElement;
        cell.click();
        cell.click();
        fixture.detectChanges();
        tick(100);
        expect(page._changeData.type).toBe('dblClick');
      }));
      xit('should be ingore input', fakeAsync(() => {
        const el = page.getCell() as HTMLElement;
        // mock input nodeName
        spyOnProperty(el, 'nodeName', 'get').and.returnValue('INPUT');
        el.click();
        fixture.detectChanges();
        tick(100);
        page.expectChangeType('click', false);
      }));
    });
    describe('[public method]', () => {
      describe('#load', () => {
        xit('nothing specified', () => {
          expect(context.change).not.toHaveBeenCalled();
          fixture.detectChanges();
          comp.load();
          expect(context.change).toHaveBeenCalled();
        });
        xit(`can specify page number`, () => {
          expect(context.change).not.toHaveBeenCalled();
          fixture.detectChanges();
          comp.load(2);
          expect(context.change).toHaveBeenCalled();
          expect(comp.pi).toBe(2);
        });
        xit(`can specify extra params`, () => {
          expect(context.change).not.toHaveBeenCalled();
          fixture.detectChanges();
          comp.load(1, { a: 1 });
          expect(context.change).toHaveBeenCalled();
          expect(comp.req.params.a).toBe(1);
        });
        xit('shoule be keeping extra params when do not passed', () => {
          comp.load(1, { a: 1 });
          expect(comp.req.params.a).toBe(1);
          comp.load(1);
          expect(comp.req.params.a).toBe(1);
        });
        xit('shoule be merge extra params', () => {
          comp.load(1, { a: 1 });
          comp.load(1, { b: 2 }, { merge: true });
          expect(comp.req.params.a).toBe(1);
          expect(comp.req.params.b).toBe(2);
        });
        xit(`can't contaminate raw data`, () => {
          const params: any = { a: 1 };
          context.req = { params };
          fixture.detectChanges();
          comp.load(1, { b: 2 }, { merge: true });
          expect(comp.req.params.a).toBe(1);
          expect(comp.req.params.b).toBe(2);
          expect(params.b).toBeUndefined();
        });
      });
      describe('#reload', () => {
        xit('keeping current page index', () => {
          fixture.detectChanges();
          comp.load(2);
          expect(comp.pi).toBe(2);
          comp.reload();
          expect(comp.pi).toBe(2);
        });
        xit('without extra params', () => {
          expect(context.change).not.toHaveBeenCalled();
          const orgExtraParams = comp.req.params;
          fixture.detectChanges();
          comp.reload();
          expect(context.change).toHaveBeenCalled();
          expect(comp.req.params).toBe(orgExtraParams);
        });
        xit(`with extra params`, () => {
          expect(context.change).not.toHaveBeenCalled();
          fixture.detectChanges();
          comp.reload({ a: 1 });
          expect(context.change).toHaveBeenCalled();
          expect(comp.req.params.a).toBe(1);
        });
        xit('merge extra params', () => {
          comp.reload({ a: 1 });
          comp.reload({ b: 2 }, { merge: true });
          expect(comp.req.params.a).toBe(1);
          expect(comp.req.params.b).toBe(2);
        });
      });
      describe('#reset', () => {
        xit('always the first page', () => {
          fixture.detectChanges();
          comp.load(2);
          expect(comp.pi).toBe(2);
          comp.reset();
          expect(comp.pi).toBe(1);
        });
        xit('without extra params', () => {
          expect(context.change).not.toHaveBeenCalled();
          const orgExtraParams = comp.req.params;
          fixture.detectChanges();
          comp.reset();
          expect(context.change).toHaveBeenCalled();
          expect(comp.req.params).toBe(orgExtraParams);
          expect(comp.pi).toBe(1);
        });
        xit(`with extra params`, () => {
          expect(context.change).not.toHaveBeenCalled();
          fixture.detectChanges();
          comp.reset({ a: 1 });
          expect(context.change).toHaveBeenCalled();
          expect(comp.req.params.a).toBe(1);
          expect(comp.pi).toBe(1);
        });
        xit('merge extra params', () => {
          comp.reset({ a: 1 });
          comp.reset({ b: 2 }, { merge: true });
          expect(comp.req.params.a).toBe(1);
          expect(comp.req.params.b).toBe(2);
        });
        xit('should be clean check, radio, filter, sort', done => {
          spyOn(comp, 'clearCheck').and.returnValue(comp);
          spyOn(comp, 'clearRadio').and.returnValue(comp);
          spyOn(comp, 'clearFilter').and.returnValue(comp);
          spyOn(comp, 'clearSort').and.returnValue(comp);
          comp.reset();
          fixture.whenStable().then(() => {
            expect(comp.clearCheck).toHaveBeenCalled();
            expect(comp.clearRadio).toHaveBeenCalled();
            expect(comp.clearFilter).toHaveBeenCalled();
            expect(comp.clearSort).toHaveBeenCalled();
            done();
          });
        });
      });
      describe('#removeRow', () => {
        xit('shoule be working', done => {
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectCurrentPageTotal(PS);
            comp.removeRow(comp._data[0]);
            page.expectCurrentPageTotal(PS - 1);
            comp.removeRow(1);
            page.expectCurrentPageTotal(PS - 2);
            done();
          });
        });
        xit('shoule be recalculate no value', done => {
          page.newColumn([{ title: '', type: 'no' }]).then(() => {
            page.expectCurrentPageTotal(PS);
            comp._data.forEach((v, idx) => expect(v._values[0].text).toBe(idx + 1));
            comp.removeRow(comp._data[0]);
            comp._data.forEach((v, idx) => expect(v._values[0].text).toBe(idx + 1));
            done();
          });
        });
        xit('shoule be ingored invalid data', done => {
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectCurrentPageTotal(PS);
            comp.removeRow([null]);
            page.expectCurrentPageTotal(PS);
            done();
          });
        });
      });
      describe('#setRow', () => {
        xit('should be working', done => {
          fixture.detectChanges();
          fixture.whenStable().then(() => {
            page.expectData(1, 'name', `name 1`);
            comp.setRow(0, { name: 'new name' });
            page.expectData(1, 'name', `new name`);
            done();
          });
        });
      });
      describe('#clean', () => {
        beforeEach(() => {
          spyOn(comp, 'clearCheck').and.returnValue(comp);
          spyOn(comp, 'clearRadio').and.returnValue(comp);
          spyOn(comp, 'clearFilter').and.returnValue(comp);
          spyOn(comp, 'clearSort').and.returnValue(comp);
          fixture.detectChanges();
        });
        xit('#clear', done => {
          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(PS);
            comp.clear();
            expect(comp._data.length).toBe(0);
            done();
          });
        });
        xit('#clear, excludes clean status', done => {
          fixture.whenStable().then(() => {
            expect(comp._data.length).toBe(PS);
            expect(comp.clearCheck).not.toHaveBeenCalled();
            comp.clear(false);
            expect(comp._data.length).toBe(0);
            expect(comp.clearCheck).not.toHaveBeenCalled();
            done();
          });
        });
        xit('#clearStatus', () => {
          expect(comp.clearCheck).not.toHaveBeenCalled();
          comp.clearStatus();
          expect(comp.clearCheck).toHaveBeenCalled();
        });
      });
      describe('#resetColumns', () => {
        xit('should working', done => {
          let res = true;
          const cls = '.st__body tr[data-index="0"] td';
          page.newColumn([{ title: '', index: 'name', iif: () => res }]).then(() => {
            page.expectElCount(cls, 1);
            res = false;
            comp.resetColumns();
            fixture.detectChanges();
            page.expectElCount(cls, 0);
            done();
          });
        });
        xit('should be specify new columns', done => {
          page.newColumn([{ title: '1', index: 'name' }]).then(() => {
            page.expectHead('1', 'name');
            comp.resetColumns({ columns: [{ title: '2', index: 'name' }] });
            fixture.detectChanges();
            page.expectHead('2', 'name');
            done();
          });
        });
        xit('should be specify new pi', done => {
          page.newColumn([{ title: '1', index: 'name' }]).then(() => {
            expect(comp.pi).toBe(1);
            comp.resetColumns({ pi: 2 });
            expect(comp.pi).toBe(2);
            done();
          });
        });
        xit('should be specify new ps', done => {
          page.newColumn([{ title: '1', index: 'name' }]).then(() => {
            expect(comp.ps).toBe(PS);
            comp.resetColumns({ ps: 2 });
            expect(comp.ps).toBe(2);
            done();
          });
        });
        xit('should be ingore data reload', done => {
          page.newColumn([{ title: '1', index: 'name' }]).then(() => {
            expect(comp.ps).toBe(PS);
            const compAny = comp as any;
            spyOn(compAny, 'loadPageData');
            comp.resetColumns({ emitReload: false });
            expect(compAny.loadPageData).not.toHaveBeenCalled();
            done();
          });
        });
      });
      xit('#filteredData', done => {
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect((comp.data as any[]).length).toBe(DEFAULTCOUNT);
          expect(comp._data.length).toBe(PS);
          comp.filteredData.then(list => {
            expect(list.length).toBe(DEFAULTCOUNT);
            done();
          });
        });
      });
      xit('#count', done => {
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(comp.count).toBe(PS);
          done();
        });
      });
      xit('#list', done => {
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(comp.list.length).toBe(PS);
          done();
        });
      });
      xit('#cdkVirtualScrollViewport', done => {
        context.virtualScroll = true;
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          expect(context.comp.cdkVirtualScrollViewport != null).toBe(true);
          done();
        });
      });
    });
    describe('#export', () => {
      let exportSrv: STExport;
      beforeEach(() => {
        // tslint:disable-next-line:no-string-literal
        exportSrv = comp['exportSrv'] = {
          export: jasmine.createSpy('export'),
        } as any;
      });
      describe('without specified data', () => {
        xit('when data is array data', () => {
          context.data = genData(1);
          fixture.detectChanges();
          expect(exportSrv.export).not.toHaveBeenCalled();
          comp.export();
          expect(exportSrv.export).toHaveBeenCalled();
        });
        xit('when data is true', fakeAsync(() => {
          context.data = genData(1);
          fixture.detectChanges();
          spyOnProperty(comp, 'filteredData', 'get').and.returnValue(Promise.resolve([]));
          expect(exportSrv.export).not.toHaveBeenCalled();
          comp.export(true);
          tick();
          expect(exportSrv.export).toHaveBeenCalled();
        }));
        xit('when data is observable data', () => {
          context.data = of(genData(1));
          fixture.detectChanges();
          expect(exportSrv.export).not.toHaveBeenCalled();
          comp.export();
          expect(exportSrv.export).toHaveBeenCalled();
        });
      });
      describe('with specified data', () => {
        xit('should be specified array data', () => {
          expect(exportSrv.export).not.toHaveBeenCalled();
          comp.export([], {});
          expect(exportSrv.export).toHaveBeenCalled();
        });
      });
    });
    describe('#multiSort', () => {
      xit('with true', () => {
        context.multiSort = true;
        fixture.detectChanges();
        const ms: STMultiSort = comp.multiSort;
        expect(typeof ms).toBe('object');
      });
      xit('with false', () => {
        context.multiSort = false;
        fixture.detectChanges();
        const ms: STMultiSort = comp.multiSort;
        expect(ms).toBeNull();
      });
      xit('with object', () => {
        context.multiSort = { key: 'aa' };
        fixture.detectChanges();
        const ms: STMultiSort = comp.multiSort;
        expect(typeof ms).toBe('object');
        expect(ms.key).toBe('aa');
      });
    });
    describe('#widthMode', () => {
      xit('with type is default', done => {
        context.widthMode = { type: 'default' };
        fixture.detectChanges();
        fixture.whenStable().then(() => {
          page.expectElCount(`.st__width-default`, 1);
          done();
        });
      });
      describe('with type is strict', () => {
        xit('shoule be add text-truncate class when className is empty and behavior is truncate', done => {
          context.widthMode = { type: 'strict', strictBehavior: 'truncate' };
          fixture.detectChanges();
          page.newColumn([{ title: '', index: 'id', width: 50 }]).then(() => {
            page.expectElCount(`.st__width-strict`, 1);
            page.expectElCount(`.st__width-strict-truncate`, 1);
            page.expectElCount(`td.text-truncate`, context.comp._data.length);
            done();
          });
        });
        xit('should be ingore add text-truncate class when className is non-empty', done => {
          context.widthMode = { type: 'strict', strictBehavior: 'truncate' };
          fixture.detectChanges();
          page.newColumn([{ title: '', index: 'id', width: 50, className: 'aaaa' }]).then(() => {
            page.expectElCount(`.st__width-strict`, 1);
            page.expectElCount(`.st__width-strict-truncate`, 1);
            page.expectElCount(`.text-truncate`, 0);
            page.expectElCount(`td.aaaa`, context.comp._data.length);
            done();
          });
        });
        xit('should be ingore add text-truncate class when type is img', done => {
          context.widthMode = { type: 'strict', strictBehavior: 'truncate' };
          fixture.detectChanges();
          page.newColumn([{ index: 'img', type: 'img', width: 50 }]).then(() => {
            page.expectElCount(`.st__width-strict`, 1);
            page.expectElCount(`.st__width-strict-truncate`, 1);
            page.expectElCount(`td.text-truncate`, 0);
            done();
          });
        });
      });
    });
    describe('#loading', () => {
      xit('should be control loading property', done => {
        context.loading = true;
        fixture.detectChanges();
        fixture
          .whenStable()
          .then(() => {
            fixture.detectChanges();
            page.expectElCount(`.ant-spin-spinning`, 1);
            context.loading = false;
            fixture.detectChanges();
            return fixture.whenStable();
          })
          .then(() => {
            fixture.detectChanges();
            page.expectElCount(`.ant-spin-spinning`, 0);
            done();
          });
      });
    });
    describe('#button', () => {
      describe('#iifBehavior', () => {
        xit('with hide', done => {
          page
            .newColumn([
              {
                title: '',
                buttons: [{ text: 'a', click: () => 'load', iif: () => false, iifBehavior: 'hide' }],
              },
            ])
            .then(() => {
              page.expectElCount('.st__body tr td a', 0);
              done();
            });
        });
        xit('with disabled', done => {
          page
            .newColumn([
              {
                title: '',
                buttons: [{ text: 'a', click: () => 'load', iif: () => false, iifBehavior: 'disabled' }],
              },
            ])
            .then(() => {
              page.expectElCount('.st__btn-disabled', PS);
              done();
            });
        });
      });
      xit('#tooltip', done => {
        page
          .newColumn([
            {
              title: '',
              buttons: [{ text: 'a', click: () => 'load', tooltip: 't' }],
            },
          ])
          .then(() => {
            page.expectElCount('.st__body [nz-tooltip]', PS);
            done();
          });
      });
    });
  });

  describe('**slow**', () => {
    describe('#multiSort', () => {
      xit('should default is mulit sorting by config', () => {
        genModule({
          minColumn: true,
          providers: [
            {
              provide: STConfig,
              useValue: Object.assign(new STConfig(), { multiSort: { global: true } } as STConfig),
            },
          ],
        });
        const ms: STMultiSort = comp.multiSort;
        expect(ms).not.toBeUndefined();
      });
      xit('should default non-mulit sorting by config', () => {
        genModule({
          minColumn: true,
          providers: [
            {
              provide: STConfig,
              useValue: Object.assign(new STConfig(), { multiSort: { global: false } } as STConfig),
            },
          ],
        });
        const ms: STMultiSort = comp.multiSort;
        expect(ms).toBeUndefined();
      });
    });
    describe('[custom render template]', () => {
      xit('with column title', done => {
        genModule({
          template: `<st #st [data]="data" [columns]="columns">
            <ng-template st-row="id" type="title"><div class="id-title">ID</div></ng-template>
          </st>`,
        });
        page.newColumn([{ title: '', index: 'id', renderTitle: 'id' }]).then(() => {
          expect(page.getHead('id').querySelector('.id-title')!.textContent).toBe('ID');
          done();
        });
      });
      xit('should be custom row', done => {
        genModule({
          template: `<st #st [data]="data" [columns]="columns">
            <ng-template st-row="id" let-item><div class="j-id">id{{item.id}}</div></ng-template>
          </st>`,
        });
        page.newColumn([{ title: '', index: 'id', render: 'id' }]).then(() => {
          expect(page.getCell().querySelector('.j-id')!.textContent).toBe('id1');
          done();
        });
      });
      xit('allow invalid id', done => {
        genModule({
          template: `<st #st [data]="data" [columns]="columns">
            <ng-template st-row="invalid-id" let-item><div class="j-id">id{{item.id}}</div></ng-template>
          </st>`,
        });
        page.newColumn([{ title: '', index: 'id', render: 'id' }]).then(() => {
          expect(page.getCell().querySelector('.j-id')).toBeNull();
          done();
        });
      });
    });
    describe('[i18n]', () => {
      let curLang = 'en';
      beforeEach(() => {
        genModule({ i18n: true });
        spyOn(i18nSrv, 'fanyi').and.callFake(() => curLang);
      });
      xit('should working', done => {
        page.newColumn([{ title: { i18n: curLang }, index: 'id' }]).then(() => {
          const el = page.getEl('.ant-pagination-total-text');
          expect(el.textContent!.trim()).toContain(`共`);
          TestBed.inject<DelonLocaleService>(DelonLocaleService).setLocale(en_US);
          fixture.detectChanges();
          expect(el.textContent!.trim()).toContain(`of`);
          done();
        });
      });
      xit('should be re-render columns when i18n changed', done => {
        curLang = 'en';
        page.newColumn([{ title: { i18n: curLang }, index: 'id' }]).then(() => {
          page.expectHead(curLang, 'id');
          curLang = 'zh';
          i18nSrv.use(curLang);
          fixture.detectChanges();
          page.expectHead(curLang, 'id');
          done();
        });
      });
    });
  });

  class PageObject {
    _changeData: STChange;
    changeSpy: jasmine.Spy;
    constructor() {
      spyOn(context, 'error');
      this.changeSpy = spyOn(context, 'change').and.callFake(((e: NzSafeAny) => (this._changeData = e)) as NzSafeAny);
      comp = context.comp;
    }
    get(cls: string): DebugElement {
      return dl.query(By.css(cls));
    }
    getEl(cls: string): HTMLElement {
      const el = dl.query(By.css(cls));
      expect(el).not.toBeNull();
      return el.nativeElement as HTMLElement;
    }
    click(cls: string): this {
      const el = this.getEl(cls);
      expect(el).not.toBeNull();
      el.click();
      fixture.detectChanges();
      return this;
    }
    clickCell(cls: string, row: number = 1, column: number = 1): this {
      const el = this.getCell(row, column).querySelector(cls) as HTMLElement;
      expect(el).not.toBeNull();
      el.click();
      fixture.detectChanges();
      return this;
    }
    /**
     * 获取单元格，下标从 `1` 开始
     */
    getCell(row: number = 1, column: number = 1) {
      const cell = (dl.nativeElement as HTMLElement).querySelector(
        `.st__body tr[data-index="${row - 1}"] td:nth-child(${column})`,
      ) as HTMLElement;
      return cell;
    }
    /**
     * 断言单元格内容，下标从 `1` 开始
     * @param value 当 `null` 时，表示无单元格
     * @param cls 对单元格进一步筛选
     * @param isContain 是否包含条件
     */
    expectCell(value: string | null, row: number = 1, column: number = 1, cls?: string, isContain?: boolean): this {
      let cell = this.getCell(row, column);
      if (cls) {
        cell = cell.querySelector(cls) as HTMLElement;
      }
      if (value == null) {
        expect(cell).toBeNull();
      } else {
        if (isContain === true) {
          expect(cell.innerHTML).toContain(value);
        } else {
          expect(cell.innerText.trim()).toBe(value);
        }
      }
      return this;
    }
    /** 获取标头 */
    getHead(name: string) {
      const el = (dl.nativeElement as HTMLElement).querySelector(`.ant-table-thead th[data-col="${name}"]`) as HTMLElement;
      return el;
    }
    clickHead(name: string, cls: string): this {
      const el = this.getHead(name).querySelector(cls) as HTMLElement;
      expect(el).not.toBeNull();
      el.click();
      fixture.detectChanges();
      return this;
    }
    expectHead(value: string, name: string, cls?: string): this {
      let cell = this.getHead(name);
      if (cls) cell = cell.querySelector(cls) as HTMLElement;
      if (value == null) {
        expect(cell).toBeNull();
      } else {
        expect(cell.innerText.trim()).toBe(value);
      }
      return this;
    }
    /** 断言组件内 `_columns` 值 */
    expectColumn(title: string, path: string, valule: any): this {
      const ret = deepGet(
        comp._columns.find(w => (w.title as STColumnTitle).text === title),
        path,
      );
      expect(ret).toBe(valule);
      return this;
    }
    /** 断言组件内 `_data` 值，下标从 `1` 开始 */
    expectData(row: number, path: string, valule: any): this {
      const ret = deepGet(comp._data[row - 1], path);
      expect(ret).toBe(valule);
      return this;
    }
    /** 切换分页 */
    go(pi: number = 2) {
      this.getEl(`.ant-pagination [title="${pi}"]`).click();
      fixture.detectChanges();
      return fixture.whenStable();
    }
    newColumn(columns: STColumn[], pi = 1, ps = PS) {
      context.columns = columns;
      context.pi = pi;
      context.ps = ps;
      fixture.detectChanges();
      return fixture.whenStable();
    }
    expectCompData(path: string, value: any): this {
      expect(deepGet(comp, path)).toBe(value);
      return this;
    }
    expectDataTotal(value: number): this {
      expect(deepGet(comp, 'total')).toBe(value);
      return this;
    }
    expectTotalPage(value: number): this {
      const a = dl.query(By.css('nz-pagination')).componentInstance as NzPaginationComponent;
      expect(a.getLastIndex(a.nzTotal, a.nzPageSize)).toBe(value);
      return this;
    }
    expectCurrentPageTotal(value: number): this {
      expect(comp._data.length).toBe(value);
      return this;
    }
    expectCompDataPi(value: number): this {
      expect(deepGet(comp, 'pi')).toBe(value);
      return this;
    }
    expectElCount(cls: string, count: number, expectationFailOutput?: string): this {
      const els = document.querySelectorAll(cls);
      expect(els.length).toBe(count, expectationFailOutput);
      return this;
    }
    expectElContent(cls: string, content: string, expectationFailOutput?: string): this {
      const el = document.querySelector(cls);
      if (content == null) {
        expect(el).toBeNull(expectationFailOutput);
      } else {
        expect(el!.textContent!.trim()).toBe(content, expectationFailOutput);
      }
      return this;
    }
    expectChangeType(type: STChangeType, called = true) {
      const callAll = this.changeSpy.calls.all();
      const args = callAll[callAll.length - 1].args[0];
      if (called) {
        expect(args.type).toBe(type);
      } else {
        expect(args.type).not.toBe(type);
      }
    }
    openDropDownInHead(nams: string): this {
      dispatchDropDown(dl.query(By.css(`.ant-table-thead th[data-col="${nams}"]`)), 'click');
      fixture.detectChanges();
      return this;
    }
    openDropDownInRow(row: number = 1) {
      dispatchDropDown(dl.query(By.css(`.st__body tr[data-index="${row - 1}"]`)), 'mouseleave');
      fixture.detectChanges();
      return this;
    }
    asyncEnd() {
      discardPeriodicTasks();
      return this;
    }
  }
});

@Component({
  template: `
    <st
      #st
      [data]="data"
      [req]="req"
      [res]="res"
      [columns]="columns"
      [ps]="ps"
      [pi]="pi"
      [total]="total"
      [page]="page"
      [responsive]="responsive"
      [responsiveHideHeaderFooter]="responsiveHideHeaderFooter"
      [widthMode]="widthMode"
      [loading]="loading"
      [loadingDelay]="loadingDelay"
      [virtualScroll]="virtualScroll"
      [bordered]="bordered"
      [size]="size"
      [scroll]="scroll"
      [multiSort]="multiSort"
      [noResult]="noResult"
      [widthConfig]="widthConfig"
      [rowClickTime]="rowClickTime"
      (change)="change($event)"
      (error)="error()"
    >
    </st>
  `,
})
class TestComponent {
  @ViewChild('st', { static: true })
  comp: STComponent;
  data: string | any[] | Observable<any[]> | null = deepCopy(USERS);
  res: STRes = {};
  req: STReq = {};
  columns: STColumn[];
  ps = PS;
  pi: number;
  total: number;
  page: STPage = {};
  loading: boolean | null = null;
  loadingDelay: number;
  bordered: boolean;
  size: 'small' | 'middle' | 'default';
  scroll: { y?: string; x?: string };
  multiSort: boolean | STMultiSort;
  noResult = 'noResult';
  widthConfig: string[];
  rowClickTime = 200;
  responsive = false;
  responsiveHideHeaderFooter = false;
  expandRowByClick = false;
  expandAccordion = false;
  widthMode: STWidthMode = {};
  virtualScroll = false;

  error() {}
  change() {}
}

@Component({
  template: `
    <st
      #st
      [data]="data"
      [columns]="columns"
      [expand]="expand"
      [expandRowByClick]="expandRowByClick"
      [expandAccordion]="expandAccordion"
      (change)="change($event)"
    >
      <ng-template #expand let-item let-index="index" let-column="column">
        {{ item.id }}
      </ng-template>
    </st>
  `,
})
class TestExpandComponent extends TestComponent {}
