import {adqueryIdSubmodule, storage} from 'modules/adqueryIdSystem.js';
import {server} from 'test/mocks/xhr.js';
import {GlobalExchange, internal as adagio, VERSION} from "../../../modules/adagioBidAdapter";
import * as utils from "../../../src/utils";

const config = {
  storage: {
    type: 'html5',
  },
};

describe('AdqueryIdSystem', function () {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  describe('qid submodule', () => {
    it('should expose a "name" property containing qid', () => {
      expect(adqueryIdSubmodule.name).to.equal('qid');
    });

    it('should expose a "gvlid" property containing the GVL ID 902', () => {
      expect(adqueryIdSubmodule.gvlid).to.equal(902);
    });
  });

  describe('getId', function () {
    let getDataFromLocalStorageStub;

    beforeEach(function () {
      getDataFromLocalStorageStub = sinon.stub(storage, 'getDataFromLocalStorage');
      sandbox.stub(utils, 'getUniqueIdentifierStr').returns('6dd9eab7df9ca5763001fb');
    });

    afterEach(function () {
      getDataFromLocalStorageStub.restore();
    });

    it('gets a adqueryId', function () {
      const config = {
        params: {}
      };
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(config).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.eq(`https://bidder.adquery.io/prebid/qid?qid=6dd9eab7df9ca5763001fb`);
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({qid: 'qid'}));
      expect(callbackSpy.lastCall.lastArg).to.deep.equal({qid: 'qid'});
    });

    it('gets a cached adqueryId', function () {
      const config = {
        params: {}
      };
      getDataFromLocalStorageStub.withArgs('qid').returns('qid');

      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(config).callback;
      callback(callbackSpy);
      expect(callbackSpy.lastCall.lastArg).to.deep.equal({qid: 'qid'});
    });

    it('allows configurable id url', function () {
      const config = {
        params: {
          url: 'https://bidder.adquery.io'
        }
      };
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(config).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.eq('https://bidder.adquery.io');
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({qid: 'testqid'}));
      expect(callbackSpy.lastCall.lastArg).to.deep.equal({qid: 'testqid'});
    });
  });
});
