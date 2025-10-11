module Callable
  extend ActiveSupport::Concern

  class_methods do
    def call_attributes(*attrs)
      attr_reader(*attrs)

      define_method(:initialize) do |**kwargs|
        attrs.each do |attr|
          instance_variable_set("@#{attr}", kwargs.fetch(attr))
        end
      end
    end

    def call(**kwargs)
      new(**kwargs).call
    end
  end
end
