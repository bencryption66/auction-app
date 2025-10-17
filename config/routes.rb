require 'sidekiq/web'

Rails.application.routes.draw do
  post '/auth/verify_signature', to: 'auth#verify_signature'
  delete '/auth/sign_out', to: 'auth#sign_out'
  get '/auth/current_user', to: 'auth#current_user_info'

  resources :auctions do
    member do
      get :current_price
      get :blockchain_price
    end
    collection do
      get :check
    end
  end
  resources :assets
  resources :accounts do
    resources :assets, only: [:index]
  end

  get "/premium", to: "assets#index"

  Sidekiq::Web.use Rack::Auth::Basic do |username, password|
    username == ENV.fetch("SIDEKIQ_USERNAME", "admin") &&
    password == ENV.fetch("SIDEKIQ_PASSWORD", "password")
  end

  mount Sidekiq::Web => '/sidekiq'
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
  root to: redirect('/assets')
end
