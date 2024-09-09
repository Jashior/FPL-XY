import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { EChartsOption } from 'echarts';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { Player } from '../models/Player';
import {
  getAxisKeys,
  getAxisTitle,
  getAxisViewValueArray,
  roundToNearestDictionary,
} from '../models/Axes';
import { PlayersService, DEFAULT_FILTER } from '../services/players.service';
import { Filter } from '../models/Filter';
import { Positions } from '../models/Positions';
import {
  animate,
  state,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { GraphService } from '../services/graph.service';
import { environment } from 'src/environments/environment';
import { take } from 'rxjs/operators';
import { Axis } from '../models/Axes';
@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  animations: [
    trigger('fadeBetweenGraphAndTable', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('in => out', animate('550ms ease-out')),
      transition('out => in', animate('550ms ease-in')),
    ]),
    trigger('fadeOnResize', [
      state('Resizing', style({ opacity: 0 })),
      state('Resized', style({ opacity: 1 })),
      transition('Resizing => Resized', animate('1000ms ease-in')),
    ]),
  ],
})
export class GraphComponent implements OnInit, OnDestroy {
  @Input() playersF$?: Observable<Player[]>;
  @Input() playersGW$?: Observable<Player[]>;
  @Input() expandScreen: boolean = false;
  @Output() expandScreenChanged: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  loadingRaw$?: Observable<boolean>;
  normAxis: boolean = true;
  playersF: Player[] = [];
  chartOption: EChartsOption = {};
  possibleXAxis: Axis[] = getAxisViewValueArray();
  possibleYAxis: Axis[] = getAxisViewValueArray();
  DEFAULT_X_AXIS = 'price';
  DEFAULT_Y_AXIS = 'points_t';
  selectedXAxis = this.DEFAULT_X_AXIS;
  selectedYAxis = this.DEFAULT_Y_AXIS;
  axisMinRange: any = {};
  axisMaxRange: any = {};
  axisMinRangeNorm: any = {};
  axisMaxRangeNorm: any = {};
  filter?: Filter;
  roundToNearestDictionary = roundToNearestDictionary;
  regression: boolean = true;
  highlighted?: number[];
  gwrange?: number[];
  loading: boolean = true;
  graphMode: boolean = true;
  chartInstance: any;
  graphModeVisible: boolean = true;
  resizeState: 'Resizing' | 'Resized' = 'Resized';
  linkCopiedText: 'Copy Link' | 'Copied!' = 'Copy Link';
  playthroughMode: boolean = false;

  COLOR_MAP = {
    GOALKEEPER: '#f7f494',
    DEFENDER: '#87f7cf',
    MIDFIELDER: '#fc97af',
    FORWARD: '#72ccff',
    DARK: '#1e262f',
  };

  subscriptions: Subscription[] = [];

  constructor(
    private playersService: PlayersService,
    private graphService: GraphService
  ) {}

  ngOnInit(): void {
    this.loadingRaw$ = this.playersService.getLoadingState();
    this.subscriptions.push(
      this.playersService.getFilter().subscribe((filter) => {
        this.filter = filter;
      }),

      this.playersService.getHighlightedPlayers().subscribe((highlighted) => {
        this.highlighted = highlighted;
      }),

      this.playersService.getGameweekRange().subscribe((gwrange) => {
        this.gwrange = gwrange;
      }),

      this.graphService
        .getXAxis()
        .pipe(take(1))
        .subscribe((axis) => {
          this.updateXAxis(axis);
        }),
      this.graphService
        .getYAxis()
        .pipe(take(1))
        .subscribe((axis) => {
          this.updateYAxis(axis);
        }),
      this.graphService.getPlaythroughMode().subscribe((mode) => {
        this.playthroughMode = mode;
      })
    );

    if (this.playersF$) {
      this.subscriptions.push(
        this.playersF$?.subscribe((players) => {
          this.loading = true;
          this.playersF = players;
          if (players.length > 0) {
            this.adjustAvailableAxes(players[0]);
          }
          this.loadMinMax(
            players,
            this.axisMinRangeNorm,
            this.axisMaxRangeNorm
          );
          this.loadChartOptions();
          this.loading = false;
        })
      );
    }

    if (this.playersGW$) {
      this.subscriptions.push(
        this.playersGW$?.subscribe((players) => {
          this.loadMinMax(players, this.axisMinRange, this.axisMaxRange);
        })
      );
    }
  }

  adjustAvailableAxes(player: Player) {
    let axes = getAxisKeys();
    for (let a of axes) {
      const existsInPlayer = a in player;

      this.possibleXAxis = this.possibleXAxis.map((x: any) => {
        if (x.value === a) {
          // Only enable if it exists in the player data AND it's not currently selected as the Y-axis
          x.disabled = !(existsInPlayer && x.value !== this.selectedYAxis);
        }
        return x;
      });

      this.possibleYAxis = this.possibleYAxis.map((x: any) => {
        if (x.value === a) {
          // Only enable if it exists in the player data AND it's not currently selected as the X-axis
          x.disabled = !(existsInPlayer && x.value !== this.selectedXAxis);
        }
        return x;
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getChartTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)')['matches']
      ? 'chalk'
      : 'vintage';
  }

  // isSelectedAxisDisabled(): boolean {
  //   const selectedAxis = this.possibleAxis.find(
  //     (a) => a.value === this.selectedXAxis
  //   );
  //   let isDisabled = selectedAxis?.disabled ?? false;
  //   return isDisabled;
  // }
  isSelectedXAxisDisabled(): boolean {
    const selectedAxis = this.possibleXAxis.find(
      (a) => a.value === this.selectedXAxis
    );
    let isDisabled = selectedAxis?.disabled ?? false;
    return isDisabled;
  }
  isSelectedYAxisDisabled(): boolean {
    const selectedAxis = this.possibleYAxis.find(
      (a) => a.value === this.selectedYAxis
    );
    let isDisabled = selectedAxis?.disabled ?? false;
    return isDisabled;
  }

  sortFnX = (a: Player, b: Player) =>
    a[this.selectedXAxis] - b[this.selectedXAxis];
  sortFnY = (a: Player, b: Player) =>
    a[this.selectedYAxis] - b[this.selectedYAxis];

  getSortFnX = () => {
    return this.sortFnX;
  };

  getSortFnY = () => {
    return this.sortFnY;
  };

  toggleExpandScreen(expand: boolean) {
    this.resizeState = 'Resizing';
    this.expandScreen = expand;
    this.expandScreenChanged.emit(this.expandScreen);
    setTimeout(() => {
      this.resizeState = 'Resized';
    }, 250);
  }

  loadMinMax(
    players: Player[],
    min: { [x: string]: number },
    max: { [x: string]: number }
  ) {
    if (players.length == 0) return;
    if (this.playthroughMode) return;

    let axisKeys = getAxisKeys();

    for (let key of axisKeys) {
      min[key] = 1000000;
      max[key] = 0;
    }

    // Loads up min/max maps for all possible measures
    for (let p of players) {
      if (p.minutes_t <= 10) continue;
      let player: any = p;
      for (let key of axisKeys) {
        min[key] = player[key] < min[key] ? Number(player[key]) : min[key];
        max[key] = player[key] > max[key] ? Number(player[key]) : max[key];
      }
    }

    // Ensure all minimums rounded down to specific (defaults to rounding to 2 s.f. if no info)
    for (let key of axisKeys) {
      if (key in this.roundToNearestDictionary) {
        min[key] =
          Math.floor(min[key] / this.roundToNearestDictionary[key]) *
          this.roundToNearestDictionary[key];
        // incase of 24.000000001 error:
        min[key] = parseFloat(min[key].toFixed(4));
      } else {
        min[key] = Number(min[key].toPrecision(2));
      }
    }

    // Ensure all maximums rounded up to specific (defaults to rounding to 2 s.f. if no info)
    for (let key of axisKeys) {
      if (key in this.roundToNearestDictionary) {
        // +0.0001 so a max of 90 to nearest 5 becomes eg. 95 rather than 90
        max[key] =
          Math.ceil((max[key] + 0.0001) / this.roundToNearestDictionary[key]) *
          this.roundToNearestDictionary[key];
        // incase of 24.000000001 error:
        max[key] = parseFloat(max[key].toFixed(4));
      } else {
        max[key] = Number(max[key].toPrecision(2));
      }
    }
  }

  updateXAxis(axis: string): void {
    this.graphService.setXAxis(axis);
    this.selectedXAxis = axis;
    this.possibleYAxis = [
      ...this.possibleYAxis.map((yAxisOption) => {
        yAxisOption.disabled = yAxisOption.value === axis;
        return yAxisOption;
      }),
    ];
    this.loadChartOptions();
  }

  updateYAxis(axis: string): void {
    this.graphService.setYAxis(axis);
    this.selectedYAxis = axis;
    this.possibleXAxis = [
      ...this.possibleXAxis.map((xAxisOption) => {
        xAxisOption.disabled = xAxisOption.value === axis;
        return xAxisOption;
      }),
    ];
    this.loadChartOptions();
  }
  getTitle() {
    return `${getAxisTitle(this.selectedYAxis)} against ${getAxisTitle(
      this.selectedXAxis
    )}`;
  }

  getAxisTitle(axis: string) {
    return getAxisTitle(axis);
  }

  getInnerWidth() {
    return window.innerWidth;
  }

  getSubtitle() {
    let year = this.playersService.getYearString();
    if (this.getInnerWidth() < 650) {
      return `Gameweeks ${this.gwrange ? this.gwrange[0] : ''}-${
        this.gwrange ? this.gwrange[1] : ''
      }`;
    }
    return `${year}: GW ${this.gwrange ? this.gwrange[0] : ''}-${
      this.gwrange ? this.gwrange[1] : ''
    } • Price £${this.filter?.min_price}m-£${
      this.filter?.max_price
    }m • At least ${this.filter?.min_minutes} mins played • Ownership ${
      this.filter?.min_tsb
    }%-${this.filter?.max_tsb}%`;
  }

  tooltipFormatter(params: any) {
    function getToolTip(data: any, dimensionNames: any, encode: any) {
      let x = dimensionNames[encode['x'][0]]; // 'price'
      let y = dimensionNames[encode['y'][0]]; // 'npxG_t'
      let toolTipString = `
      <div class="w-48">
      <span class="flex justify-between">
      <u><b>${data.name}</b></u> 
      <img src="${getIcon(
        data.team
      )}" alt="" style="width:2rem;height:2rem;float="left";display:"inline-block;float:"left";">
      </span>
      <small>${data.price}m • ${data.minutes_t} mins</small>
      </br>
      <small>${data.tsb}% ownership</small>
      </br>
      <small><u>${getAxisTitle(x)}:</u></small> ${data[x].toFixed(2)}
      </br>
      <small><u>${getAxisTitle(y)}:</u></small> ${data[y].toFixed(2)} 
      </br>
      </div>
      `;
      return toolTipString;
    }
    return getToolTip(params.data, params.dimensionNames, params.encode);
  }

  getRegressionCoords() {
    // Calculate regression line
    const regressionLine = this.calculateRegressionLine(this.playersF);

    // Generate coordinates for trendline based on x-axis range
    const xMin = this.axisMinRangeNorm[this.selectedXAxis];
    const xMax = this.axisMaxRangeNorm[this.selectedXAxis];

    // Calculate y-values for the trendline using the regression equation
    const yMin = regressionLine.slope * xMin + regressionLine.intercept;
    const yMax = regressionLine.slope * xMax + regressionLine.intercept;

    // Adjust coordinates if they exceed axis bounds
    const xAxisMin = this.axisMinRangeNorm[this.selectedXAxis];
    const xAxisMax = this.axisMaxRangeNorm[this.selectedXAxis];
    const yAxisMin = this.axisMinRangeNorm[this.selectedYAxis];
    const yAxisMax = this.axisMaxRangeNorm[this.selectedYAxis];

    const adjustedTrendlineCoordinates = [
      [Math.max(xAxisMin, xMin), Math.max(yAxisMin, Math.min(yAxisMax, yMin))],
      [Math.min(xAxisMax, xMax), Math.max(yAxisMin, Math.min(yAxisMax, yMax))],
    ];
    return adjustedTrendlineCoordinates;
  }

  loadChartOptions() {
    this.chartOption = {
      title: {
        text: this.getTitle(),
        subtext: this.getSubtitle(),
        left: 'center',
        textStyle: {
          overflow: 'break',
        },
        subtextStyle: {
          fontSize: 12,
          overflow: 'break',
        },
      },
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            bottom: 10,
            style: {
              text: 'graphed at fpl.zanaris.dev',
              fill: 'rgba(86, 86, 86, 1)',
              fontSize: 10,
            },
          },
        ],
      },
      tooltip: {
        formatter: this.tooltipFormatter,
        trigger: 'item',
      },
      xAxis: {
        type: 'value',
        name: getAxisTitle(this.selectedXAxis),
        nameLocation: 'middle',
        nameGap: 24,
        min: this.normAxis
          ? this.axisMinRangeNorm[this.selectedXAxis]
          : this.axisMinRange[this.selectedXAxis],
        max: this.normAxis
          ? this.axisMaxRangeNorm[this.selectedXAxis]
          : this.axisMaxRange[this.selectedXAxis],
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: getAxisTitle(this.selectedYAxis),
        nameLocation: 'middle',
        nameGap: 40,
        min: this.normAxis
          ? this.axisMinRangeNorm[this.selectedYAxis]
          : this.axisMinRange[this.selectedYAxis],
        max: this.normAxis
          ? this.axisMaxRangeNorm[this.selectedYAxis]
          : this.axisMaxRange[this.selectedYAxis],
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      dataset: {
        source: this.playersF,
        dimensions: this.playersF[0] ? Object.keys(this.playersF[0]) : [],
      },
      series: [
        {
          type: 'scatter',
          itemStyle: {
            opacity: 0.75,
          },
          symbolSize: 8,
          encode: {
            x: this.selectedXAxis,
            y: this.selectedYAxis,
          },
          animation: true,
          label: {
            show: true,
            position: 'right',
            // formatter: function (param) {
            //   function getLabel(data: any) {
            //     return `${data.name}`;
            //   }
            //   return getLabel(param.data);
            // },
            formatter: (param) => {
              function getLabel(data: any, highlighted: any) {
                if (highlighted.length == 0) {
                  return `{default|${data.name}}`;
                }
                const isHighlighted = highlighted.includes(data.fpl_id);
                return `{${isHighlighted ? 'highlight' : 'faded'}|${
                  data.name
                }}`;
              }
              return getLabel(param.data, this.highlighted);
            },
            fontSize: 13,
            minMargin: 2,
            opacity: 1,
            silent: true,
            rich: {
              highlight: {
                fontSize: 13,
                color: '#ffffff',
              },
              default: {
                fontSize: 9,
              },
              faded: {
                fontSize: 8,
                opacity: 0.7,
              },
            },
          },
          labelLayout: {
            moveOverlap: 'shuffleY',
            hideOverlap: true,
            fontSize: 9,
          },
          emphasis: {
            label: {
              show: true,
            },
            itemStyle: {
              opacity: 1,
            },
          },
          markLine: {
            animation: false,
            lineStyle: {
              type: 'dashed',
              color: '#177DDC',
              opacity: 0.75,
            },
            tooltip: {
              show: false,
              triggerOn: 'none',
            },
            silent: true,
            data: this.regression
              ? [
                  [
                    { coord: this.getRegressionCoords()[0], symbol: 'none' },
                    { coord: this.getRegressionCoords()[1], symbol: 'none' },
                  ],
                ]
              : [], // Empty array when this.regression is false
          },
        },
      ],
      visualMap: [
        {
          type: 'piecewise',
          categories: Positions,
          dimension: this.playersF[0]
            ? Object.keys(this.playersF[0]).indexOf('position')
            : 0,
          itemWidth: 12,
          left: 'center',
          inRange: {
            color: [
              this.COLOR_MAP['GOALKEEPER'],
              this.COLOR_MAP['DEFENDER'],
              this.COLOR_MAP['MIDFIELDER'],
              this.COLOR_MAP['FORWARD'],
            ],
          },
          showLabel: false,
          show: false,
        },
        {
          type: 'piecewise',
          categories: [0, 1, 2],
          dimension: this.playersF[0]
            ? Object.keys(this.playersF[0]).indexOf('highlight')
            : 0,
          left: 'center',
          inRange: {
            symbolSize: [6, 10, 14],
            opacity: [0.2, 0.75, 1],
            liftZ: [0, 50, 100],
          },
          showLabel: true,
          show: false,
          z: 10,
        },
      ],
    };
  }

  onChartEvent(event: any, type: string) {
    this.togglePlayer(event.data);
  }

  togglePlayer(data: Player) {
    this.playersService.toggleHighlightedPlayer(data.fpl_id);
  }

  getIcon(team: any) {
    return `../../assets/team-icons/${team}.svg`;
  }

  getPipeString(axis: string) {
    if (axis == 'price') {
      return '1.1-1';
    }
    if (axis.includes('_90')) {
      return '1.2-2';
    }
    return '1.0-2';
  }

  // Calculate regression line using linear regression algorithm
  calculateRegressionLine(data: any[]) {
    const sumX = data.reduce(
      (total, point) => total + point[this.selectedXAxis],
      0
    );
    const sumY = data.reduce(
      (total, point) => total + point[this.selectedYAxis],
      0
    );
    const n = data.length;
    const meanX = sumX / n;
    const meanY = sumY / n;
    let numerator = 0;
    let denominator = 0;
    for (const point of data) {
      numerator +=
        (point[this.selectedXAxis] - meanX) *
        (point[this.selectedYAxis] - meanY);
      denominator += Math.pow(point[this.selectedXAxis] - meanX, 2);
    }
    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;
    return { slope, intercept };
  }

  toggleFadeTransition(): void {
    this.graphModeVisible = !this.graphModeVisible;
  }

  captureScreenshot() {
    const element: HTMLElement | null = this.graphMode
      ? document.getElementById('graph-display')
      : (document.getElementsByClassName('ant-table')[0] as HTMLElement);
    if (element) {
      html2canvas(element).then((canvas) => {
        const image = canvas.toDataURL('image/png');
        saveAs(image, `${this.getTitle()}.png`);
      });
    }
  }

  getShareableLink() {
    const baseUrl = `${window.location.origin}/visual`;

    combineLatest([
      this.playersService.getFilter().pipe(take(1)),
      this.playersService.getGameweekRange().pipe(take(1)),
      this.playersService.getHighlightedPlayers().pipe(take(1)),
    ]).subscribe(
      ([filter, gameweekRange, highlightedPlayers]: [
        Filter,
        number[],
        number[]
      ]) => {
        const DEFAULT_FILTER = this.playersService.getDefaultFilter();

        const params = new URLSearchParams({});

        if (filter.min_price !== DEFAULT_FILTER.min_price) {
          params.set('price_min', filter.min_price.toString());
        }

        if (filter.max_price !== DEFAULT_FILTER.max_price) {
          params.set('price_max', filter.max_price.toString());
        }

        if (filter.min_tsb !== DEFAULT_FILTER.min_tsb) {
          params.set('ownership_min', filter.min_tsb.toString());
        }

        if (filter.max_tsb !== DEFAULT_FILTER.max_tsb) {
          params.set('ownership_max', filter.max_tsb.toString());
        }

        if (filter.positions.length !== DEFAULT_FILTER.positions.length) {
          params.set('positions', filter.positions.join(',').toString());
        }

        if (filter.teams.length !== DEFAULT_FILTER.teams.length) {
          params.set('teams', filter.teams.join(',').toString());
        }

        if (filter.min_minutes !== DEFAULT_FILTER.min_minutes) {
          params.set('mins', filter.min_minutes.toString());
        }

        if (
          gameweekRange[0] !== 1 ||
          gameweekRange[1] !== this.playersService.getCurrentGameweek()
        ) {
          params.set('gameweek_range', gameweekRange.join(',').toString());
        }

        if (highlightedPlayers.length > 0) {
          params.set(
            'highlight_players',
            highlightedPlayers.join(',').toString()
          );
        }

        if (filter.excluded_players.length > 0) {
          params.set(
            'exclude_players',
            filter.excluded_players.join(',').toString()
          );
        }

        if (this.selectedXAxis !== this.DEFAULT_X_AXIS) {
          params.set('x_axis', this.selectedXAxis);
        }

        if (this.selectedYAxis !== this.DEFAULT_Y_AXIS) {
          params.set('y_axis', this.selectedYAxis);
        }

        if (!this.playersService.isDefaultYear()) {
          params.set('year', this.playersService.getYearString());
        }

        const shareableLink = `${baseUrl}?${params}`;

        const dummyElement = document.createElement('textarea');
        dummyElement.value = shareableLink;
        document.body.appendChild(dummyElement);
        dummyElement.select();
        document.execCommand('copy');
        document.body.removeChild(dummyElement);

        setTimeout(() => {
          this.linkCopiedText = 'Copied!';
        }, 50);

        return shareableLink;
      }
    );
  }

  setLinkCopyText() {
    this.linkCopiedText = 'Copy Link';
  }
}

function getIcon(team: any) {
  return `../../assets/team-icons/${team}.svg`;
}
