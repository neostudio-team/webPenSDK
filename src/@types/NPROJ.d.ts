declare module "*.nproj" {
  const nproj: string; // Change this to an actual XML type
  export default nproj;
}

declare module "*.json" {
  const json: PuiJSON; // Change this to an actual XML type
  export default json;
}

type PuiJSON = {
  nproj: {
    $: {
      version: string;
      category: string;
    },
    preset: [
      {
        pattern: string[],
        sound: [
          $: {
            set: string;
            filter: string;
          }
        ],
        video: [
          $: {
            set: string;
            filter: string;
          }
        ],
        image: [
          $: {
            set: string;
            filter: string;
          }
        ],
        res_count: string[],
        default_res_lang: string[],
        export_script: string[],
        ncp: string[],
        relation_link: string[],
        dummy: string[],
        manual_action: string[],
        symbol_setting: [
          $: {
            align: string;
            bgcolor: string;
            bgalpha: string;
            outline_alpha: string;
            textcolor: string;
            textsize: string;
            texton: string;
          }
        ],
        margin: [
          $: {
            left: string;
            top: string;
            right: string;
            bottom: string;
          }
        ]
      }
    ],
    book: [
      {
        title: string[],
        author: string[],
        section: string[],
        owner: string[],
        code: string[],
        revision: string[],
        scale: string[],
        start_page: [
          {
            _: string;
            $: {
              side: string;
            }
          }
        ]
        dot_is_line_segment: string[],
        line_segment_length: string[],
        target_dpi: string[],
        dotsize: string[],
        segment_info: [
          $: {
            sub_code: string;
            total_size: string;
            size: string;
            current_sequence: string;
            ncode_start_page: string;
            ncode_end_page: string;
          }
        ],
        extra_info: string[],
        kind: string[],
      }
    ],
    ticket: [
      {
        path: string[];
      }
    ],
    pdf: [
      {
        path: string[];
      }
    ],
    config: [
      {
        resource_mapping_mode: string[];
      }
    ],
    pages: [
      {
        $: {
          count: string;
        },
        page_item: page_itemT[];
      }
    ],
    action_table: [
      {
        action: string[];
      }
    ],
    symbols: [
      {
        symbol: symbolT[]
      }
    ],
    resources: string[]
  }
}

type page_itemT = {
  $: {
    number: string;
    rotate_angle: string;
    x1: string;
    y1: string;
    x2: string;
    y2: string;
    crop_margin: string;
    bg_disabled: string;
    page_type: string;
  }
}

type symbolT = {
  $: {
    page: string;
    page_name: string;
    type: string;
    x: string;
    y: string;
    width: string;
    height: string;
    lock: string;
    xylock: string;
  },
  name: string[],
  id: string[],
  command: [
    {
      $: {
        name: string,
        action: string,
        param: string,
      }
    }
  ],
  language_resources: [
    {
      language: languageT[]
    }
  ],
  matching_symbols: [
    {
      $: {
        previous: string,
        next: string
      }
    }
  ]
}

type languageT = {
  "$": {
    resource_country: string;
    resource_type: string;
    resource_id: string;
  }
}