angular
  .module('walletApp')
  .controller("AuthorizeApproveCtrl", AuthorizeApproveCtrl);

function AuthorizeApproveCtrl($window, $scope, WalletNetwork, $stateParams, $state, Alerts, $translate) {
  const success = (res) => {
    $scope.checkingToken = false;
    $scope.busyApproving = false;
    $scope.busyRejecting = false;

    // If differentBrowser is called, success will be null:
    if (res.success == null) return;

    $window.close(); // This is sometimes ignored, hence the code below:

    $translate('AUTHORIZE_APPROVE_SUCCESS').then(translation => {
      $state.go("public.login-uid", {uid: res.guid}).then(() => {
        Alerts.displaySuccess(translation)
      });
    });

  }

  const error = (message) => {
    $scope.checkingToken = false;
    $scope.busyApproving = false;
    $scope.busyRejecting = false;

    $state.go("public.login-no-uid");
    Alerts.displayError(message, true);
  }

  const differentBrowser = (details) => {
    $scope.checkingToken = false;

    $scope.differentBrowser = true;
    $scope.details = details;
  }

  $scope.checkingToken = true;

  WalletNetwork.authorizeApprove($stateParams.token, differentBrowser, null)
    .then(success)
    .catch(error);

  $scope.approve = () => {
    $scope.busyApproving = true;
    WalletNetwork.authorizeApprove($stateParams.token, () => {}, true)
      .then(success)
      .catch(error);
  }

  $scope.reject = () => {
    $scope.busyRejecting = true;

    const rejected = () => {
      $scope.busyRejecting = false;

      $translate('AUTHORIZE_REJECT_SUCCESS').then(translation => {
        $state.go("public.login-no-uid").then(() => {
          Alerts.displaySuccess(translation)
        });
      });
    };

    WalletNetwork.authorizeApprove($stateParams.token, () => {}, false)
      .then(rejected)
      .catch(error);
  }
}