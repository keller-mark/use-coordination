import { sum, cumsum } from 'd3-array';
import { scaleLinear } from 'd3-scale';

export class WeightedScaleBand {
    constructor() {
        this._domain = [];
        this._range = [];
        this._weights = [];
        this._cumWeights = [];
        this._normWeights = [];
        this._offsetCumWeights = [];

        this._scale = scaleLinear()
            .domain([0, 1]);
    }

    domain(param) {
        this._domain = param;
        return this;
    }

    range(param) {
        this._range = param;
        this._scale = this._scale.range(param);
        return this;
    }

    weights(param) {
        this._weights = param;

        const totalWeight = sum(param);
        this._normWeights = param.map(w => w / totalWeight);
        this._cumWeights = cumsum(this._normWeights);
        this._offsetCumWeights = [0, ...this._cumWeights.slice(0, -1)];
        return this;
    }

    getBandStart(domainVal) {
        const idx = this._domain.indexOf(domainVal);
        const cumWeight = this._offsetCumWeights[idx];

        return this._scale(cumWeight);
    }
    getBandEnd(domainVal) {
        const idx = this._domain.indexOf(domainVal);
        const cumWeight = this._cumWeights[idx];

        return this._scale(cumWeight);
    }
    getBandWidth(domainVal) {
        const idx = this._domain.indexOf(domainVal);
        const weight = this._normWeights[idx];

        return this._scale(weight);
    }

}