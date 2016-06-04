function NodeEditorData() { }

NodeEditorData.predefinedTypesJson = {
    "nodeType": [
        {
            "name": "test_1",
            "color": "#DEA5A4",
            "inputItem": [
                {
                    "name": "vstup_1",
                    "dataType": "int"
                },
            ],
            "outputItem": [
                {
                    "name": "vystup_1",
                    "dataType": "int",
                    "func": function (args) { return args.vstup_1 + 1; }
                }
            ]
        },
        {
            "name": "test_2",
            "color": "#CFCFC4",
            "contentItem": [
                {
                    "name": "obsah_1",
                    "dataType": "boolean"
                }
            ],
            "outputItem": [
                {
                    "name": "vystup_1",
                    "dataType": "int",
                    "func": function (args)
                    {
                        return args.obsah_1;
                    }
                }
            ]
        },
        {
            "name": "test_3",
            "color": "#03C03C",
            "inputItem": [
                {
                    "name": "vstup_1",
                    "dataType": "float"
                },
                {
                    "name": "vstup_2",
                    "dataType": "float"
                }
            ],
            "outputItem": [
                {
                    "name": "vystup_1",
                    "dataType": "float",
                    "func": function (args) { return args.vstup_1 + args.vstup_2; }
                }
            ]
        },
        {
            "name": "test_4",
            "color": "#03C03C",
            "contentItem": [
                {
                    "name": "vstup_1",
                    "dataType": "float"
                }
            ],
            "outputItem": [
                {
                    "name": "vystup_1",
                    "dataType": "float",
                    "func": function (args) { return args.vstup_1 }
                }
            ]
            
        }
        
    ]
}