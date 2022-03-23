import { assert } from 'chai';
import 'mocha';
import {
  ODM,
  OperationInterceptorInterface,
  OperationType,
  OperationWhen,
  Record
} from '../../../src';
import { logger, MAX_TIMEOUT, Session } from '../../test.utils';

describe('Operations Intercept', () => {
  let odm: ODM;
  let MODEL_NAME = 'intercept';

  before(async () => {
    odm = await Session.getODMByForce();
  });

  it('#ODM::addInterceptor', function (done) {
    this.timeout(MAX_TIMEOUT);
    odm.addInterceptor(
      new (class extends OperationInterceptorInterface {
        getName() {
          return 'my-intercept';
        }

        async intercept(
          collectionName: string,
          operation: OperationType,
          when: OperationWhen,
          records: Record[]
        ) {
          if (collectionName === MODEL_NAME) {
            if (operation === OperationType.CREATE) {
              logger.info(
                `[collectionName=${collectionName}] [operation=${operation}] [when=${when}]`
              );
              if (when === OperationWhen.BEFORE) {
                logger.info('before');
                for (let record of records)
                  record.set('computed', 'this is computed');
              }
            }
          }
          return records;
        }
      })()
    );

    odm.defineCollection({
      name: MODEL_NAME,
      fields: [
        {
          name: 'name',
          type: 'string'
        },
        {
          name: 'computed',
          type: 'string'
        }
      ]
    });

    let interceptTestCollection = odm.collection(MODEL_NAME);
    let s = interceptTestCollection.createNewRecord();
    s.set('name', 'John');
    s.insert().then(
      function (rec: Record) {
        assert.isOk(
          rec.get('computed') === 'this is computed',
          'read interceptor not computed the value'
        );
        done();
      },
      function (err: Error) {
        logger.info(err.message + '');
        done();
      }
    );
  });

  it('#model define check', function (done) {
    this.timeout(MAX_TIMEOUT);
    odm.deleteInterceptor('my-intercept');

    let interceptTestCollection = odm.collection(MODEL_NAME);
    let s = interceptTestCollection.createNewRecord();
    s.set('name', 'Ravi');
    s.insert().then(
      function (rec: Record) {
        assert.isOk(
          rec.get('computed') !== 'this is computed',
          'read interceptor computed the value'
        );
        done();
      },
      function (err: Error) {
        logger.logError(err);
        done();
      }
    );
  });
});
