import { Component, Input, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { Observable } from 'rxjs';
import { Player } from '../models/Player';
import {
  getAxisKeys,
  getAxisTitle,
  getAxisViewValueArray,
  roundToNearestDictionary,
} from '../models/Axes';
import { PlayersService } from '../services/players.service';
import { Filter } from '../models/Filter';
import { Positions } from '../models/Positions';
import { BreakpointBooleanMap } from 'ng-zorro-antd/core/services';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
})
export class GraphComponent implements OnInit {
  @Input() playersF$?: Observable<Player[]>;
  @Input() playersGW$?: Observable<Player[]>;
  normAxis: boolean = true;
  playersF: Player[] = [];
  chartOption: EChartsOption = {};
  possibleAxis: any = getAxisViewValueArray();
  selectedXAxis = 'price';
  selectedYAxis = 'points_t';
  axisMinRange: any = {};
  axisMaxRange: any = {};
  axisMinRangeNorm: any = {};
  axisMaxRangeNorm: any = {};
  filter?: Filter;
  roundToNearestDictionary = roundToNearestDictionary;

  COLOR_MAP = {
    GOALKEEPER: '#f7f494',
    DEFENDER: '#87f7cf',
    MIDFIELDER: '#fc97af',
    FORWARD: '#72ccff',
    DARK: '#1e262f',
  };
  highlighted?: number[];
  gwrange?: number[];
  loading: boolean = true;
  graphMode: boolean = true;
  chartInstance: any;

  getSortFunction(axis: string | number) {
    return (a: Player, b: Player) => {
      return a[axis] - b[axis];
    };
  }

  constructor(private playersService: PlayersService) {
    this.playersService.getFilter().subscribe((filter) => {
      this.filter = filter;
    });
    this.playersService.getHighlightedPlayers().subscribe((highlighted) => {
      this.highlighted = highlighted;
    });
    this.playersService.getGameweekRange().subscribe((gwrange) => {
      this.gwrange = gwrange;
    });
  }

  ngOnInit(): void {
    this.playersF$?.subscribe((players) => {
      this.loading = true;
      this.playersF = players;
      this.loadMinMax(players, this.axisMinRangeNorm, this.axisMaxRangeNorm);
      this.loadChartOptions();
      this.loading = false;
    });
    this.playersGW$?.subscribe((players) => {
      this.loadMinMax(players, this.axisMinRange, this.axisMaxRange);
    });
  }

  ngOnChanges(): void {}

  getChartTheme() {
    // theme: string = window.matchMedia('(prefers-color-scheme: dark)')['matches']
    // ? 'chalk'
    // : 'vintage';
    return window.matchMedia('(prefers-color-scheme: dark)')['matches']
      ? 'chalk'
      : 'vintage';
  }

  loadMinMax(
    players: Player[],
    min: { [x: string]: number },
    max: { [x: string]: number }
  ) {
    if (players.length == 0) return;

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
    this.selectedXAxis = axis;
    this.loadChartOptions();
  }

  updateYAxis(axis: string): void {
    this.selectedYAxis = axis;
    this.loadChartOptions();
  }

  getTitle() {
    return `${getAxisTitle(this.selectedYAxis)} against ${getAxisTitle(
      this.selectedXAxis
    )}`;
  }

  getYAxisTitle() {
    return getAxisTitle(this.selectedYAxis);
  }

  getXAxisTitle() {
    return getAxisTitle(this.selectedXAxis);
  }

  getInnerWidth() {
    return window.innerWidth;
  }

  getSubtitle() {
    if (this.getInnerWidth() < 650) {
      return `Gameweeks ${this.gwrange ? this.gwrange[0] : ''}-${
        this.gwrange ? this.gwrange[1] : ''
      }`;
    }
    return `Gameweeks ${this.gwrange ? this.gwrange[0] : ''}-${
      this.gwrange ? this.gwrange[1] : ''
    } • Price £${this.filter?.min_price}m-£${this.filter?.max_price}m • Over ${
      this.filter?.min_minutes
    } mins played • Ownership ${this.filter?.min_tsb}%-${
      this.filter?.max_tsb
    }%`;
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
      </div>
      `;
      return toolTipString;
    }
    return getToolTip(params.data, params.dimensionNames, params.encode);
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
          overflow: 'break',
        },
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
            formatter: function (param) {
              function getLabel(data: any) {
                return `${data.name}`;
              }
              return getLabel(param.data);
            },
            fontSize: 13,
            minMargin: 2,
            opacity: 1,
            silent: true,
          },
          labelLayout: {
            moveOverlap: 'shuffleX',
            hideOverlap: true,
            fontSize: 9,
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
          itemWidth: 12,
          left: 'center',
          inRange: {
            symbolSize: [6, 10, 14],
            opacity: [0.25, 0.75, 1],
            liftZ: [0, 50, 100],
          },
          showLabel: true,
          show: false,
        },
      ],
    };
  }

  onChartEvent(event: any, type: string) {
    this.togglePlayer(event.data);
  }

  togglePlayer(data: Player) {
    this.playersService.toggleHighlightedPlayer(data.fpl_id);
    // this.togglePlayerToggle.emit();
    // this.togglePlayerEvent.emit({ name: data.name, id: data.fpl_id });
  }

  resetToggle() {
    // this.resetPlayerToggle.emit();
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
}

function getIcon(team: any) {
  return `../../assets/team-icons/${team}.svg`;
}
