require 'unobtrusive_datetime_picker'

ActionView::Base.send :include, UnobtrusiveDateTimePicker::UnobtrusiveDateTimePickerHelper
ActionView::Helpers::DateHelper.send :include, UnobtrusiveDateTimePicker::UnobtrusiveDateTimePickerHelper
ActionView::Base.send :include, UnobtrusiveDateTimePicker::AssetTagHelper
ActionView::Helpers::AssetTagHelper.send :include, UnobtrusiveDateTimePicker::AssetTagHelper
