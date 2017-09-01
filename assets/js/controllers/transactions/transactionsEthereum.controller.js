angular
  .module('walletApp')
  .controller('ethereumTransactionsCtrl', ethereumTransactionsCtrl);

function ethereumTransactionsCtrl ($scope, $uibModal, $state, Wallet, Ethereum, localStorageService, $q, ShapeShift, modals) {
  $scope.loading = true;
  $scope.ethTransactions = [];
  $scope.$watch(
    () => Ethereum.txs,
    (txs) => {
      $scope.ethTransactions = txs;
      $scope.loading = false;
    },
    true
  );

  $scope.txLimit = 10;

  $scope.nextPage = () => {
    if ($scope.txLimit < $scope.ethTransactions.length) $scope.txLimit += 5;
  };

  $scope.account = Ethereum.defaultAccount;

  $scope.status = Wallet.status;
  $scope.filterBy = {
    type: undefined,
    account: undefined
  };

  $scope.ethTotal = Ethereum.balance;

  $scope.hideEtherWelcome = () => localStorageService.get('hideEtherWelcome');
  $scope.dismissWelcome = () => localStorageService.set('hideEtherWelcome', true);

  $scope.isFilterOpen = false;
  $scope.toggleFilter = () => $scope.isFilterOpen = !$scope.isFilterOpen;

  $scope.onClickCta = () => {
    if (ShapeShift.userHasAccess) {
      $state.go('wallet.common.shift');
    } else {
      modals.openRequest(null, { asset: 'eth' });
    }
  };

  $scope.exportEthPriv = () => $uibModal.open({
    templateUrl: 'partials/show-private-key-ethereum.pug',
    controllerAs: '$ctrl',
    windowClass: 'bc-modal',
    controller (Ethereum, MyWallet) {
      this.accessAllowed = false;
      this.address = Ethereum.defaultAccount.address;
      this.balance = Ethereum.defaultAccount.balance;
      let requestAccessP = MyWallet.wallet.isDoubleEncrypted ? Wallet.askForSecondPasswordIfNeeded : Wallet.askForMainPassword;
      this.requestAccess = () => requestAccessP().then(secPass => {
        this.accessAllowed = true;
        this.key = Ethereum.getPrivateKeyForAccount(Ethereum.defaultAccount, secPass).toString('hex');
      });
    }
  });

  // Searching and filtering
  if ($scope.$root.size.sm || $scope.$root.size.xs) {
    $scope.filterTypes = ['ALL_TRANSACTIONS', 'SENT', 'RECEIVED'];
  } else {
    $scope.filterTypes = ['ALL', 'SENT', 'RECEIVED'];
  }
  $scope.setFilterType = (type) => $scope.filterBy.type = $scope.filterTypes[type];
  $scope.isFilterType = (type) => $scope.filterBy.type === $scope.filterTypes[type];
  $scope.setFilterType(0);

  $scope.transactionFilter = item => {
    return ($scope.filterByType(item) && $scope.filterSearch(item, $scope.searchText));
  };

  $scope.filterSearch = (tx, search) => {
    if (!search) return true;
    tx.addresses = tx.from.concat(tx.to);
    return (tx.addresses.toLowerCase().search(search.toLowerCase()) > -1 ||
            (tx.hash.toLowerCase().search(search.toLowerCase()) > -1) ||
            (tx.note && tx.note.toLowerCase().search(search.toLowerCase()) > -1) ||
            $scope.account.label.toLowerCase().search(search.toLowerCase()) > -1);
  };

  $scope.filterByType = tx => {
    switch ($scope.filterBy.type) {
      case $scope.filterTypes[0]:
        return true;
      case $scope.filterTypes[1]:
        return tx.getTxType([$scope.account, Ethereum.legacyAccount]) === 'sent';
      case $scope.filterTypes[2]:
        return tx.getTxType([$scope.account, Ethereum.legacyAccount]) === 'received';
    }
    return false;
  };
}
