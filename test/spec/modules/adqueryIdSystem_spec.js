import { adqueryIdSubmodule, storage } from 'modules/adqueryIdSystem.js';
import { server } from 'test/mocks/xhr.js';
import sinon from 'sinon';
import { attachIdSystem } from '../../../modules/userId/index.js';
import { createEidsArray } from '../../../modules/userId/eids.js';
import { expect } from 'chai/index.mjs';

const config = {
  storage: {
    type: 'html5',
  },
};

describe('AdqueryIdSystem', function () {
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
      expect(request.url).to.contain(`https://bidder.adquery.io/prebid/qid`);
      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ qid: 'qid_string' }));
      expect(callbackSpy.lastCall.lastArg).to.deep.equal('qid_string');
    });

    it('allows configurable id url', function () {
      const config = {
        params: {
          url: 'https://bidder2.adquery.io'
        }
      };
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(config).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.contains('https://bidder2.adquery.io');
      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ qid: 'testqid' }));
      expect(callbackSpy.lastCall.lastArg).to.deep.equal('testqid');
    });

    it('should include gdpr=1 and gdpr_consent in request URL when GDPR applies', function () {
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(
        { params: {} },
        { gdpr: { gdprApplies: true, consentString: 'test-consent' } }
      ).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.include('gdpr=1');
      expect(request.url).to.include('gdpr_consent=test-consent');
      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ qid: 'q1' }));
    });

    it('should include gdpr=0 and no gdpr_consent when GDPR does not apply', function () {
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(
        { params: {} },
        { gdpr: { gdprApplies: false, consentString: 'test-consent' } }
      ).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.include('gdpr=0');
      expect(request.url).to.not.include('gdpr_consent');
      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ qid: 'q2' }));
    });

    it('should include us_privacy in request URL when USP provided', function () {
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(
        { params: {} },
        { usp: '1YNN' }
      ).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.include('us_privacy=1YNN');
      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ qid: 'q3' }));
    });

    it('should include gpp and gpp_sid in request URL when GPP provided', function () {
      const callbackSpy = sinon.spy();
      const callback = adqueryIdSubmodule.getId(
        { params: {} },
        { gpp: { gppString: 'test-gpp', applicableSections: [7, 8] } }
      ).callback;
      callback(callbackSpy);
      const request = server.requests[0];
      expect(request.url).to.include('gpp=test-gpp');
      expect(request.url).to.include('gpp_sid=7%2C8');
      request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ qid: 'q4' }));
    });
  });
  describe('eid', () => {
    before(() => {
      attachIdSystem(adqueryIdSubmodule);
    });
    it('qid', function() {
      const userId = {
        qid: 'some-random-id-value'
      };
      const newEids = createEidsArray(userId);
      expect(newEids.length).to.equal(1);
      expect(newEids[0]).to.deep.equal({
        source: 'adquery.io',
        uids: [{
          id: 'some-random-id-value',
          atype: 1
        }]
      });
    });
  })
});
