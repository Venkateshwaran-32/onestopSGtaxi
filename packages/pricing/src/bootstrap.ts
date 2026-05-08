import { registerEstimator } from './index';
import { cdgEstimator } from './estimators/cdg';
import { geolahEstimator } from './estimators/geolah';
import { gojekEstimator } from './estimators/gojek';
import { grabEstimator } from './estimators/grab';
import { rydeEstimator } from './estimators/ryde';
import { tadaEstimator } from './estimators/tada';
import { transcabEstimator } from './estimators/transcab';
import { zigEstimator } from './estimators/zig';

let bootstrapped = false;

export function bootstrapEstimators(): void {
  if (bootstrapped) return;
  registerEstimator(grabEstimator);
  registerEstimator(gojekEstimator);
  registerEstimator(tadaEstimator);
  registerEstimator(rydeEstimator);
  registerEstimator(zigEstimator);
  registerEstimator(geolahEstimator);
  registerEstimator(transcabEstimator);
  registerEstimator(cdgEstimator);
  bootstrapped = true;
}
