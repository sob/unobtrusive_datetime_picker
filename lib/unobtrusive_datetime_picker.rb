require 'date'
require 'time'

module UnobtrusiveDateTimePicker
  module UnobtrusiveDateTimePickerHelper
    # == Unobtrusive DateTime-Picker Helper
    #
    # This module helps to create date and datetime text fields
    # that use a modified version of the Unobtrusive Date-Picker 
    # Javascript Widget.
  
    DATEPICKER_DIVIDERS = { 'slash' => '/',
                            'dash'  => '-',
                            'dot'   => '.',
                            'space' => ' ' }
                          
    RANGE_DATE_FORMAT = '%Y-%m-%d'
  
    ##
    # Creates the date time picker with the calendar widget.
    #
    def unobtrusive_datetime_text_picker(object_name, method, options = {}, html_options = {})
      ActionView::Helpers::InstanceTag.new(object_name, method, self, nil, options.delete(:object)).to_datetimepicker_text_tag(options, html_options)
    end
    
    ##
    # Creates the date picker with the calendar widget.
    #
    def unobtrusive_date_text_picker(object_name, method, options = {}, html_options = {})
      ActionView::Helpers::InstanceTag.new(object_name, method, self, nil, options.delete(:object)).to_datepicker_text_tag(options, html_options)
    end
    
    ##
    # Creates the text field based datetime picker with the calendar widget without a model object.
    #
    def unobtrusive_datetime_text_picker_tag(name, date = Date.today, options = {}, html_options = {})
      options, html_options = datetimepicker_text_field_options(options, html_options)
      value = format_datetime_value_for_text_field(options[:format], options[:divider], date)
      text_field_tag(name, value, html_options)
    end
  
    ##
    # Creates the text field based date picker with the calendar widget without a model object.
    #
    def unobtrusive_date_text_picker_tag(name, date = Date.today, options = {}, html_options = {})
      options, html_options = datepicker_text_field_options(options, html_options)
      value = format_date_value_for_text_field(options[:format], options[:divider], date)
      text_field_tag(name, value, html_options)
    end
      
      
  protected

    def format_datetime_value_for_text_field(format, divider_option, value)
      divider = DATEPICKER_DIVIDERS[parse_divider_option(divider_option)]
      format_string = "%A %B %d, %Y %I:%M %p"
      # format_string = format.downcase.gsub(/min/, '%M').gsub(/b/, '%B').gsub(/(m|d)/, '%\1').gsub(/y/, '%Y').gsub(/h/, '%H').gsub(/i/, '%I').gsub(/p/, '%p').gsub('--', ' ').gsub('-', divider)
      value.strftime(format_string) rescue ""
    end
    
    def format_date_value_for_text_field(format, divider_option, value)
      divider = DATEPICKER_DIVIDERS[parse_divider_option(divider_option)]
      format_string = "%A %B %d, %Y"
      value.strftime(format_string) rescue ""
    end
      
    def make_date_picker_class_options(options = {}) # :nodoc:
      html_classes  = ["date-picker"]
      html_classes << "time-picker" if options[:time_picker]

      if options[:highlight_days]
        highlight_days = parse_days_of_week(options[:highlight_days])
        if !highlight_days.blank?
          html_classes << "highlight-days-#{highlight_days}"
        end
      end

      if options[:range_low]
        range_low = parse_range_option(options[:range_low], 'low')
        if !range_low.blank?
          html_classes << range_low
        end
      end

      if options[:range_high]
        range_high = parse_range_option(options[:range_high], 'high')
        if !range_high.blank?
          html_classes << range_high
        end
      end

      if options[:disable_days]
        disable_days = parse_days_of_week(options[:disable_days])
        if !disable_days.blank?
          html_classes << "disable-days-#{disable_days}"
        end
      end

      if options[:no_transparency]
        html_classes << 'no-transparency'
      end
    
      if options[:format] && %W(d-m-y m-d-y y-m-d b--d,--y--i:min--p).include?(options[:format].downcase)
        html_classes << "format-#{options[:format].downcase}"
      end
    
      if options[:divider]
        html_classes << "divider-#{parse_divider_option(options[:divider])}"
      end

      html_classes
    end
  
    def datetimepicker_text_field_options(options, html_options) # :nodoc:
      defaults = {:format => 'm-d-y', :divider => 'slash'}
      options = defaults.merge(options)
      html_classes = make_date_picker_class_options(options)
      html_options[:class] = html_options[:class] ? "#{html_options[:class]} #{html_classes.join(' ')}" : html_classes.join(' ')
      [options, html_options]
    end
    
    def datepicker_text_field_options(options, html_options) # :nodoc:
      defaults = {:format => 'm-d-y', :divider => 'slash', :time_picker => false}
      options = defaults.merge(options)
      html_classes = make_date_picker_class_options(options)
      html_options[:class] = html_options[:class] ? "#{html_options[:class]} #{html_classes.join(' ')}" : html_classes.join(' ')
      [options, html_options]
    end
    
    def parse_days_of_week(option) # :nodoc:
      if option.is_a? String
        option
      elsif option.is_a? Symbol
        DATEPICKER_DAYS_OF_WEEK[option]
      elsif option.is_a? Array
        days = ''
        option.each do |day|
          days << DATEPICKER_DAYS_OF_WEEK[day]
        end
        days
      end
    end

    def parse_range_option(option, direction) # :nodoc:
      if option.is_a? Symbol
        case option
        when :today
          range_class = 'today'
        when :tomorrow
          range_class = Date.tomorrow.strftime(RANGE_DATE_FORMAT)
        when :yesterday
          range_class = Date.yesterday.strftime(RANGE_DATE_FORMAT)
        end
      elsif option.is_a? String
        if !option.blank?
          range_class = Date.parse(option).strftime(RANGE_DATE_FORMAT)
        else
          range_class = nil
        end
      elsif (option.is_a?(Date) || option.is_a?(DateTime) || option.is_a?(Time))
        range_class = option.strftime(RANGE_DATE_FORMAT)
      else
        range_class = nil
      end

      if !range_class.blank?
        range_class = 'range-' + direction + '-' + range_class
      else
        nil
      end
    end
  
    def parse_divider_option(option)
      if DATEPICKER_DIVIDERS.keys.include?(option)
        option
      else
        DATEPICKER_DIVIDERS.find {|name, value| option == value}.first
      end
    end
  end
  module AssetTagHelper
    ##
    # This will add the necessary <link> and <script> tags to include the necessary stylesheet and
    # javascripts.
    #
    def unobtrusive_datetimepicker_includes(options = {})
      output = []
      output << javascript_include_tag('date', 'datetimepicker', options)
      output << stylesheet_link_tag('datetimepicker', options)
      output * "\n"
    end
  end
end

module ActionView # :nodoc: all
  module Helpers
    class InstanceTag
      include UnobtrusiveDateTimePicker::UnobtrusiveDateTimePickerHelper
        
      def to_datetimepicker_text_tag(options = {}, html_options = {})
        options, html_options = datetimepicker_text_field_options(options, html_options)
        html_options[:value] = format_datetime_value_for_text_field(options[:format], options[:divider], value(object))
        to_input_field_tag('text', html_options)
      end
      
      def to_datepicker_text_tag(options = {}, html_options = {})
        options, html_options = datepicker_text_field_options(options, html_options)
        html_options[:value] = format_date_value_for_text_field(options[:format], options[:divider], value(object))
        to_input_field_tag('text', html_options)
      end
    end
  end
end

module ActionView::Helpers::PrototypeHelper # :nodoc: all
  class JavaScriptGenerator
    module GeneratorMethods
      def unobtrusive_datetime_picker_create(id = nil)
        if id
          call "datePickerController.create", "$(#{id})"
        else
          record "datePickerController.create"
        end
      end
      
      def unobtrusive_datetime_picker_cleanup(id = nil)
        record "datePickerController.cleanUp"
      end
    end
  end
end

module ActionView # :nodoc: all
  module Helpers
    class FormBuilder      
      def unobtrusive_datetime_text_picker(method, options = {}, html_options = {})
        @template.unobtrusive_datetime_text_picker(@object_name, method, options.merge(:object => @object), html_options)
      end
      
      def unobtrusive_date_text_picker(method, options = {}, html_options = {})
        @template.unobtrusive_date_text_picker(@object_name, method, options.merge(:object => @object), html_options)
      end
    end
  end
end