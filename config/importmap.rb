# Pin npm packages by running ./bin/importmap

pin 'application'
pin '@hotwired/turbo-rails', to: '@hotwired--turbo-rails.js' # @8.0.16
pin '@hotwired/turbo', to: '@hotwired--turbo.js' # @8.0.13
pin '@rails/actioncable/src', to: '@rails--actioncable--src.js' # @8.0.200
pin '@hotwired/stimulus', to: 'https://unpkg.com/@hotwired/stimulus@3.2.2/dist/stimulus.js'
pin 'bootstrap', to: 'https://ga.jspm.io/npm:bootstrap@5.3.7/dist/js/bootstrap.esm.js'
pin '@popperjs/core', to: 'https://ga.jspm.io/npm:@popperjs/core@2.11.8/lib/index.js'
pin '@kurkle/color', to: '@kurkle--color.js' # @0.3.4
pin 'chart.js', to: 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.min.js'
pin '@web3-onboard/core', to: 'https://cdn.jsdelivr.net/npm/@web3-onboard/core@2.24.1/dist/index.min.js'
pin '@web3-onboard/injected-wallets', to: 'https://cdn.jsdelivr.net/npm/@web3-onboard/injected-wallets@2.11.3/dist/index.min.js'
pin 'ethers', to: 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.esm.min.js'
pin 'web3', to: 'https://cdn.jsdelivr.net/npm/web3@4.16.0/dist/web3.min.js'