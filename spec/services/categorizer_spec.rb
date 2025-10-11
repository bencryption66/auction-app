require 'rails_helper'

RSpec.describe Categorizer, type: :service do
  let(:name) { 'ewrewrwer.eth' }
  let(:asset) { create(:asset, name:) }

  describe '#call' do
    subject { described_class.new(asset).call }

    context 'when the asset is not eligible for any category' do
      it 'does not assign any categories' do
        expect { subject }.not_to change { asset.categories.count }
      end
    end

    context 'when the asset is eligible for a category' do
      let(:name) { '121.eth' }

      it 'assigns the category to the asset' do
        expect { subject }.to change { asset.categories.count }.by(1)
        expect(asset.categories.first.name).to eq('999')
      end
    end
  end
end
