angular
  .module('walletApp')
  .controller('CoinifyMediumController', CoinifyMediumController);

function CoinifyMediumController ($rootScope, $scope, $timeout, $q, AngularHelper, Alerts, coinify) {
  AngularHelper.installLock.call($scope);
  $scope.$timeout = $timeout;
  $scope.limits = coinify.limits;
  let { quote, baseFiat, fiatCurrency } = $scope.vm;

  let tryParse = (json) => {
    try { return JSON.parse(json); } catch (e) { return json; }
  };

  let fiatAmount = baseFiat() ? quote.baseAmount : quote.quoteAmount;
  $scope.belowCardMax = fiatAmount <= parseFloat($scope.limits.card.max[fiatCurrency()]);
  // i.e card max is 300 and buy amount is 500
  // $scope.belowCardMax = false;
  $scope.aboveBankMin = fiatAmount >= parseFloat($scope.limits.bank.min[fiatCurrency()]);
  // i.e bank min is 50 and buy amount is 30
  // $scope.aboveBankMin = false;
  // $scope.needsKYC = (medium) => fiatAmount > parseFloat($scope.limits[medium].yearlyMax[fiatCurrency()]);
  // i.e bank max is 0 and buy amount is 100
  $scope.isBank = () => $scope.vm.medium === 'bank';
  $scope.needsKYC = () => +coinify.getExchange().profile.level.name < 2;
  $scope.pendingKYC = () => coinify.kycs[0] && coinify.tradeStateIn(coinify.states.pending)(coinify.kycs[0]);

  $scope.vm.medium = $scope.belowCardMax || $rootScope.inMobileBuy ? 'card' : 'bank';

  $scope.submit = () => {
    $scope.lock();
    let { medium, quote } = $scope.vm;

    // cache accounts in My-Wallet-V3 instead
    $q.resolve(quote.getPaymentMediums())
      .then((mediums) => mediums[medium].getAccounts())
      .then((accounts) => coinify.accounts = accounts)
      .then(() => $scope.vm.goTo('summary'))
      .then($scope.free).catch((err) => console.log(err));
  };

  $scope.openKYC = () => {
    $scope.lock();

    $q.resolve(coinify.getOpenKYC())
      .then((kyc) => $scope.vm.trade = kyc)
      .then(() => $scope.vm.quote = null)
      .then(() => $scope.vm.goTo('isx'))
      .catch((err) => {
        $scope.free();
        err = tryParse(err);
        if (err.error_description) Alerts.displayError(err.error_description);
      });
  };

  $scope.lock();

  quote.getPaymentMediums()
       .then((mediums) => $scope.mediums = mediums)
       .then($scope.free).catch((err) => console.log(err));

  if ($rootScope.inMobileBuy) $scope.submit();
}
